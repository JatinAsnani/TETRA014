from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from auth import decode_token
import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session expired or user not found. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user



def get_org_user(user: models.User, db: Session) -> models.User:
    """Resolves the top-level Organization Admin/Owner User object for multi-user shared organization access."""
    curr = user
    visited = set()
    while curr and getattr(curr, 'parent_id', None) is not None:
        if curr.id in visited:
            break
        visited.add(curr.id)
        parent = db.query(models.User).filter(models.User.id == curr.parent_id).first()
        if parent:
            curr = parent
        else:
            break
    return curr if curr else user


def get_org_id(user: models.User, db: Session) -> int:
    """Resolves the top-level Organization Admin/Owner user ID."""
    org_user = get_org_user(user, db)
    return org_user.id


def require_roles(allowed_roles: list):
    """Dependency to check if current user's role is within allowed roles."""
    def role_checker(user: models.User = Depends(get_current_user)):
        user_role = (getattr(user, 'role', 'staff') or "staff").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
