from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from deps import get_current_user
import models
import schemas

router = APIRouter()


@router.post("", response_model=schemas.StockItemResponse)
def create_stock(
    data: schemas.StockItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = models.StockItem(user_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _with_flag(item)


@router.get("")
def list_stock(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(models.StockItem).filter(models.StockItem.user_id == user.id).all()
    return [_with_flag(i) for i in items]


@router.put("/{item_id}", response_model=schemas.StockItemResponse)
def update_stock(
    item_id: int,
    data: schemas.StockItemUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(models.StockItem)
        .filter(models.StockItem.id == item_id, models.StockItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _with_flag(item)


@router.get("/low")
def low_stock(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(models.StockItem)
        .filter(
            models.StockItem.user_id == user.id,
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
    item = (
        db.query(models.StockItem)
        .filter(models.StockItem.id == item_id, models.StockItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    qty = float(data.quantity)
    if data.action == "add":
        item.current_stock = Decimal(str(float(item.current_stock) + qty))
    elif data.action == "deduct":
        item.current_stock = Decimal(str(max(0, float(item.current_stock) - qty)))
    else:
        raise HTTPException(status_code=400, detail="Action must be 'add' or 'deduct'")
    db.commit()
    db.refresh(item)
    return _with_flag(item)


def _with_flag(item):
    return {
        "id": item.id,
        "name": item.name,
        "sku": item.sku,
        "category": item.category,
        "unit": item.unit,
        "current_stock": float(item.current_stock),
        "min_stock": float(item.min_stock),
        "purchase_rate": float(item.purchase_rate),
        "selling_rate": float(item.selling_rate),
        "gst_rate": float(item.gst_rate),
        "hsn_code": item.hsn_code,
        "low_stock": float(item.current_stock) < float(item.min_stock),
        "created_at": item.created_at,
    }


async def adjust_stock_from_ai(tool_input: dict, user_id: int, db) -> dict:
    item_name = tool_input.get("item_name", "")
    item = (
        db.query(models.StockItem)
        .filter(models.StockItem.user_id == user_id, models.StockItem.name.ilike(f"%{item_name}%"))
        .first()
    )
    if not item:
        return {"error": f"Stock item '{item_name}' not found"}
    qty = float(tool_input.get("quantity", 0))
    action = tool_input.get("action", "add")
    if action == "add":
        item.current_stock = Decimal(str(float(item.current_stock) + qty))
    else:
        item.current_stock = Decimal(str(max(0, float(item.current_stock) - qty)))
    db.commit()
    return {
        "success": True,
        "item": item.name,
        "current_stock": float(item.current_stock),
        "action": action,
        "quantity": qty,
    }
