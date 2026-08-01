from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from deps import get_current_user, get_org_id
from services.activity_logger import log_activity
import models
import schemas

router = APIRouter()


def _with_flag(item):
    d = item.__dict__ if hasattr(item, "__dict__") else item
    curr = float(getattr(item, 'current_stock', 0))
    min_stk = float(getattr(item, 'min_stock', 0))
    return {
        "id": getattr(item, 'id', None),
        "name": getattr(item, 'name', ''),
        "sku": getattr(item, 'sku', ''),
        "category": getattr(item, 'category', ''),
        "unit": getattr(item, 'unit', 'pcs'),
        "current_stock": curr,
        "min_stock": min_stk,
        "purchase_rate": float(getattr(item, 'purchase_rate', 0)),
        "selling_rate": float(getattr(item, 'selling_rate', 0)),
        "gst_rate": float(getattr(item, 'gst_rate', 18)),
        "hsn_code": getattr(item, 'hsn_code', None),
        "is_low_stock": curr < min_stk,
    }


@router.post("", response_model=schemas.StockItemResponse)
def create_stock(
    data: schemas.StockItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    item = models.StockItem(user_id=org_id, **data.model_dump())
    db.add(item)
    db.flush()
    log_activity(
        db, user,
        action_type="CREATE_STOCK",
        entity_type="stock",
        entity_id=item.id,
        description=f"Added Stock Item '{item.name}' (Qty: {item.current_stock} {item.unit})",
        amount=float(item.selling_rate or 0) * float(item.current_stock or 0),
    )
    db.commit()
    db.refresh(item)
    return _with_flag(item)


@router.get("")
def list_stock(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    items = db.query(models.StockItem).filter(models.StockItem.user_id == org_id).all()
    return [_with_flag(i) for i in items]


@router.put("/{item_id}", response_model=schemas.StockItemResponse)
def update_stock(
    item_id: int,
    data: schemas.StockItemUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    item = (
        db.query(models.StockItem)
        .filter(models.StockItem.id == item_id, models.StockItem.user_id == org_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    log_activity(
        db, user,
        action_type="UPDATE_STOCK",
        entity_type="stock",
        entity_id=item.id,
        description=f"Updated Stock Item '{item.name}'",
        amount=float(item.selling_rate or 0),
    )
    db.commit()
    db.refresh(item)
    return _with_flag(item)


@router.get("/low")
def low_stock(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    items = (
        db.query(models.StockItem)
        .filter(
            models.StockItem.user_id == org_id,
            models.StockItem.current_stock < models.StockItem.min_stock,
        )
        .all()
    )
    return [_with_flag(i) for i in items]


@router.post("/{item_id}/adjust")
def adjust_stock(
    item_id: int,
    data: schemas.StockAdjust,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    item = (
        db.query(models.StockItem)
        .filter(models.StockItem.id == item_id, models.StockItem.user_id == org_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")

    qty = Decimal(str(data.quantity))
    if data.action == "add":
        item.current_stock += qty
    elif data.action == "deduct":
        item.current_stock = max(Decimal("0"), item.current_stock - qty)

    db.commit()
    db.refresh(item)
    return _with_flag(item)
