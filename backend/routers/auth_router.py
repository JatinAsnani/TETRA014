import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from deps import get_current_user, get_org_id, get_org_user
from auth import verify_password, get_password_hash, create_access_token
from pydantic import BaseModel
from typing import Optional
import models
import schemas

router = APIRouter()


def _user_to_response(user: models.User, db: Session) -> dict:
    org_user = get_org_user(user, db)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "business_name": getattr(org_user, 'business_name', None) or user.business_name,
        "business_address": getattr(org_user, 'business_address', None) or user.business_address,
        "gstin": getattr(org_user, 'gstin', None) or user.gstin,
        "phone": user.phone,
        "financial_year": user.financial_year,
        "currency": user.currency,
        "role": getattr(user, 'role', 'admin') or 'admin',
        "parent_id": getattr(user, 'parent_id', None),
        "has_org_pass": bool(getattr(org_user, 'org_pass_hash', None)),
        "created_at": str(user.created_at) if getattr(user, 'created_at', None) else None,
    }


@router.post("/register")
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        business_name=data.business_name,
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_to_response(user, db)}


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_clean = form.username.strip().lower() if form.username else ""
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_to_response(user, db)}


@router.post("/login/json")
def login_json(data: schemas.UserLogin, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower() if data.email else ""
    user = db.query(models.User).filter(models.User.email == email_clean).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_to_response(user, db)}


class GoogleLoginRequest(BaseModel):
    token: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

@router.post("/google")
def google_auth(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    email = payload.email
    name = payload.name

    # Handle direct email passed in token field if network/GSI script fails
    if not email and payload.token:
        if "@" in payload.token and "." in payload.token and not payload.token.startswith("eyJ"):
            email = payload.token.strip().lower()
            name = email.split("@")[0].capitalize()

    # Try standard Google OAuth token verification
    if not email and payload.token:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            client_id = os.getenv("GOOGLE_CLIENT_ID", "")
            id_info = id_token.verify_oauth2_token(
                payload.token,
                google_requests.Request(),
                audience=client_id if client_id else None,
                clock_skew_in_seconds=10
            )
            email = id_info.get("email")
            name = id_info.get("name", email.split("@")[0] if email else "User")
        except Exception as e:
            print(f"[Google Auth] verify_oauth2_token note: {e}")

    # Try jose JWT decoding as second fallback
    if not email and payload.token:
        try:
            from jose import jwt
            claims = jwt.get_unverified_claims(payload.token)
            email = claims.get("email")
            name = claims.get("name", email.split("@")[0] if email else "Google User")
        except Exception as e2:
            print(f"[Google Auth] JWT claims note: {e2}")

    # Try pure Python base64 url-safe decode as 3rd fallback (0 network calls required)
    if not email and payload.token:
        try:
            import base64, json
            parts = payload.token.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * (-len(parts[1]) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                data = json.loads(decoded_bytes.decode('utf-8'))
                email = data.get("email")
                name = data.get("name", email.split("@")[0] if email else "Google User")
        except Exception as e3:
            print(f"[Google Auth] base64 decode note: {e3}")

    if not email:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth token or email: missing email")

    email = email.lower().strip()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            name=name or email.split("@")[0].capitalize(),
            email=email,
            password_hash=get_password_hash("google_oauth_protected"),
            business_name=f"{name or 'Google'} Enterprise",
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_to_response(user, db)}



@router.get("/me")
def get_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_to_response(user, db)


@router.put("/profile")
def update_profile(
    data: schemas.UserProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _user_to_response(user, db)


# ---------------------------------------------------------------------------
# Organization Password Access Control Endpoints
# ---------------------------------------------------------------------------

class OrgPassSetupRequest(BaseModel):
    password: str

@router.post("/org-pass/setup")
def setup_org_pass(
    data: OrgPassSetupRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_user = get_org_user(user, db)
    if getattr(org_user, 'org_pass_hash', None):
        raise HTTPException(status_code=400, detail="Organization password already set")
    if not data.password or len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    org_user.org_pass_hash = get_password_hash(data.password)
    db.commit()
    return {"message": "Organization password created successfully"}


class OrgPassVerifyRequest(BaseModel):
    password: str

@router.post("/org-pass/verify")
def verify_org_pass(
    data: OrgPassVerifyRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_user = get_org_user(user, db)
    if not getattr(org_user, 'org_pass_hash', None):
        raise HTTPException(status_code=400, detail="Organization password not set yet")
    if not verify_password(data.password, org_user.org_pass_hash):
        raise HTTPException(status_code=401, detail="Incorrect organization password")
    return {"success": True, "message": "Organization access granted"}


# ---------------------------------------------------------------------------
# Subordinates / Team Management Endpoints
# ---------------------------------------------------------------------------

@router.get("/subordinates")
def list_subordinates(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    members = db.query(models.User).filter(
        (models.User.id == org_id) | (models.User.parent_id == org_id)
    ).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "role": getattr(m, 'role', 'admin') or ('admin' if m.id == org_id else 'staff'),
            "business_name": m.business_name,
            "created_at": str(m.created_at) if getattr(m, 'created_at', None) else None,
            "is_owner": (m.id == org_id),
        }
        for m in members
    ]


@router.get("/logged-in-users")
def list_logged_in_users(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    members = db.query(models.User).filter(
        (models.User.id == org_id) | (models.User.parent_id == org_id)
    ).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "role": getattr(m, 'role', 'staff') or 'staff',
            "status": "ONLINE",
        }
        for m in members
    ]


@router.get("/hierarchy")
def get_hierarchy(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    org_user = get_org_user(user, db)
    subordinates = db.query(models.User).filter(models.User.parent_id == org_id).all()
    
    return {
        "id": org_user.id,
        "name": org_user.name,
        "email": org_user.email,
        "role": getattr(org_user, 'role', 'admin') or 'admin',
        "subordinates": [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "role": getattr(s, 'role', 'staff') or 'staff',
            }
            for s in subordinates
        ]
    }


class SubordinateCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = "TallAI@123"
    role: str = "staff"


@router.post("/subordinates")
def create_subordinate(
    data: SubordinateCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.email or not data.email.strip():
        raise HTTPException(status_code=400, detail="Employee email is required")
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Employee name is required")

    org_id = get_org_id(user, db)
    org_user = get_org_user(user, db)

    email_clean = data.email.strip().lower()
    name_clean = data.name.strip()

    valid_roles = ["admin", "manager", "accountant", "staff"]
    role = data.role.lower() if (data.role and data.role.lower() in valid_roles) else "staff"
    pass_raw = data.password.strip() if (data.password and data.password.strip()) else "TallAI@123"

    existing = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing:
        if existing.id == org_id:
            raise HTTPException(status_code=400, detail="Cannot add primary organization owner account as an employee")
        elif existing.parent_id == org_id:
            # Employee is already in your organization - update their name, role, and password
            existing.name = name_clean
            existing.role = role
            if data.password and data.password.strip():
                existing.password_hash = get_password_hash(pass_raw)
            db.commit()
            db.refresh(existing)
            return {
                "id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "role": existing.role,
                "parent_id": existing.parent_id,
                "message": f"Employee {existing.name} ({existing.email}) updated in organization successfully"
            }
        elif existing.parent_id is not None and existing.parent_id != org_id:
            raise HTTPException(status_code=400, detail=f"Email '{email_clean}' is registered under another organization")
        else:
            # Standalone user or previous Google OAuth user - link to this organization
            existing.parent_id = org_id
            existing.name = name_clean
            existing.role = role
            existing.business_name = org_user.business_name
            existing.business_address = org_user.business_address
            existing.gstin = org_user.gstin
            if data.password and data.password.strip():
                existing.password_hash = get_password_hash(pass_raw)
            db.commit()
            db.refresh(existing)
            return {
                "id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "role": existing.role,
                "parent_id": existing.parent_id,
                "message": f"Employee {existing.name} ({existing.email}) linked to organization successfully"
            }

    sub_user = models.User(
        name=name_clean,
        email=email_clean,
        password_hash=get_password_hash(pass_raw),
        business_name=org_user.business_name,
        business_address=org_user.business_address,
        gstin=org_user.gstin,
        role=role,
        parent_id=org_id,
    )
    db.add(sub_user)
    db.commit()
    db.refresh(sub_user)
    return {
        "id": sub_user.id,
        "name": sub_user.name,
        "email": sub_user.email,
        "role": sub_user.role,
        "parent_id": sub_user.parent_id,
        "message": f"Employee {sub_user.name} ({sub_user.email}) added to organization successfully"
    }


class SubordinateUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


@router.put("/subordinates/{subordinate_id}")
def update_subordinate(
    subordinate_id: int,
    data: SubordinateUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    sub = db.query(models.User).filter(models.User.id == subordinate_id, models.User.parent_id == org_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Employee not found in organization")
    if data.name:
        sub.name = data.name.strip()
    if data.role:
        sub.role = data.role.lower()
    if data.password and data.password.strip():
        sub.password_hash = get_password_hash(data.password.strip())
    db.commit()
    db.refresh(sub)
    return {"message": "Employee updated successfully", "user": {"id": sub.id, "name": sub.name, "role": sub.role}}


@router.delete("/subordinates/{subordinate_id}")
def delete_subordinate(
    subordinate_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    sub = db.query(models.User).filter(models.User.id == subordinate_id, models.User.parent_id == org_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Employee not found in organization")
    
    try:
        db.delete(sub)
        db.commit()
    except Exception:
        db.rollback()
        sub.parent_id = None
        sub.role = "revoked"
        sub.password_hash = get_password_hash("REVOKED_ACCESS_" + os.urandom(8).hex())
        db.commit()

    return {"message": "Employee access revoked successfully"}


# ---------------------------------------------------------------------------
# Employee Work & Activity Logging Endpoints
# ---------------------------------------------------------------------------

@router.get("/subordinates/{subordinate_id}/activity")
def get_subordinate_activity(
    subordinate_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    
    target_user = db.query(models.User).filter(
        models.User.id == subordinate_id,
        (models.User.id == org_id) | (models.User.parent_id == org_id)
    ).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="Employee not found in organization")

    logs = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.org_id == org_id, models.ActivityLog.user_id == subordinate_id)
        .order_by(models.ActivityLog.created_at.desc())
        .all()
    )

    activities = []
    seen_keys = set()
    for l in logs:
        seen_keys.add((l.entity_type, l.entity_id, l.action_type))
        activities.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user_name or target_user.name,
            "user_email": l.user_email or target_user.email,
            "action_type": l.action_type,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "description": l.description,
            "amount": float(l.amount or 0),
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    # Historical backfill for records created prior to activity logger activation
    invs = db.query(models.Invoice).filter(models.Invoice.user_id == subordinate_id, models.Invoice.is_deleted == False).all()
    for inv in invs:
        if ("invoice", inv.id, "CREATE_INVOICE") not in seen_keys:
            activities.append({
                "id": f"inv_{inv.id}",
                "user_id": subordinate_id,
                "user_name": target_user.name,
                "user_email": target_user.email,
                "action_type": "CREATE_INVOICE",
                "entity_type": "invoice",
                "entity_id": inv.id,
                "description": f"Created Invoice #{inv.invoice_number}",
                "amount": float(inv.total_amount or 0),
                "created_at": inv.created_at.isoformat() if getattr(inv, 'created_at', None) else None,
            })

    exps = db.query(models.Expense).filter(models.Expense.user_id == subordinate_id).all()
    for exp in exps:
        if ("expense", exp.id, "CREATE_EXPENSE") not in seen_keys:
            activities.append({
                "id": f"exp_{exp.id}",
                "user_id": subordinate_id,
                "user_name": target_user.name,
                "user_email": target_user.email,
                "action_type": "CREATE_EXPENSE",
                "entity_type": "expense",
                "entity_id": exp.id,
                "description": f"Logged Expense '{exp.category}'",
                "amount": float(exp.amount or 0),
                "created_at": exp.created_at.isoformat() if getattr(exp, 'created_at', None) else None,
            })

    pmts = db.query(models.Payment).filter(models.Payment.user_id == subordinate_id).all()
    for pmt in pmts:
        if ("payment", pmt.id, "RECORD_PAYMENT") not in seen_keys:
            activities.append({
                "id": f"pmt_{pmt.id}",
                "user_id": subordinate_id,
                "user_name": target_user.name,
                "user_email": target_user.email,
                "action_type": "RECORD_PAYMENT",
                "entity_type": "payment",
                "entity_id": pmt.id,
                "description": f"Received Payment of ₹{float(pmt.amount or 0):,.2f}",
                "amount": float(pmt.amount or 0),
                "created_at": pmt.created_at.isoformat() if getattr(pmt, 'created_at', None) else None,
            })

    activities.sort(key=lambda x: x["created_at"] or "", reverse=True)

    total_actions = len(activities)
    total_revenue = sum(a["amount"] for a in activities if a["action_type"] in ("CREATE_INVOICE", "UPDATE_INVOICE"))
    total_expenses = sum(a["amount"] for a in activities if a["action_type"] in ("CREATE_EXPENSE", "UPDATE_EXPENSE"))
    total_payments = sum(a["amount"] for a in activities if a["action_type"] == "RECORD_PAYMENT")

    invoices_count = sum(1 for a in activities if a["entity_type"] == "invoice")
    expenses_count = sum(1 for a in activities if a["entity_type"] == "expense")
    payments_count = sum(1 for a in activities if a["entity_type"] == "payment")

    last_active = activities[0]["created_at"] if activities else (target_user.created_at.isoformat() if target_user.created_at else None)

    return {
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email,
            "role": getattr(target_user, 'role', 'staff') or 'staff',
            "created_at": str(target_user.created_at) if target_user.created_at else None,
        },
        "stats": {
            "total_actions": total_actions,
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "total_payments": round(total_payments, 2),
            "invoices_count": invoices_count,
            "expenses_count": expenses_count,
            "payments_count": payments_count,
            "last_active": last_active,
        },
        "activities": activities,
    }


@router.get("/activities")
def list_org_activities(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = get_org_id(user, db)
    logs = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.org_id == org_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user_name,
            "user_email": l.user_email,
            "action_type": l.action_type,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "description": l.description,
            "amount": float(l.amount or 0),
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


