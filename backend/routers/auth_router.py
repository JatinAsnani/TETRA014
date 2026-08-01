from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from deps import get_current_user
from auth import verify_password, get_password_hash, create_access_token
import os
import models
import schemas

router = APIRouter()


@router.post("/register", response_model=schemas.TokenResponse)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        business_name=data.business_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login/json", response_model=schemas.TokenResponse)
def login_json(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(user: models.User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    data: schemas.UserProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users-list")
def get_users_list(secret: str, db: Session = Depends(get_db)):
    expected_secret = os.getenv("SECRET_KEY")
    if not expected_secret or secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret key")
    
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "business_name": u.business_name,
            "created_at": u.created_at
        }
        for u in users
    ]


@router.get("/ledger-logs")
def get_ledger_logs(secret: str, db: Session = Depends(get_db)):
    expected_secret = os.getenv("SECRET_KEY")
    if not expected_secret or secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret key")
    
    entries = db.query(models.LedgerEntry).order_by(models.LedgerEntry.created_at.desc()).limit(100).all()
    return [
        {
            "id": e.id,
            "user_id": e.user_id,
            "account_name": e.account_name,
            "account_type": e.account_type,
            "debit": float(e.debit) if e.debit else 0.0,
            "credit": float(e.credit) if e.credit else 0.0,
            "balance": float(e.balance) if e.balance else 0.0,
            "description": e.description,
            "reference_type": e.reference_type,
            "reference_id": e.reference_id,
            "entry_date": e.entry_date,
            "created_at": e.created_at
        }
        for e in entries
    ]
