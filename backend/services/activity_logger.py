from decimal import Decimal
from sqlalchemy.orm import Session
from deps import get_org_id
import models


def log_activity(
    db: Session,
    user: models.User,
    action_type: str,
    entity_type: str,
    entity_id: int = None,
    description: str = "",
    amount: float = 0.0,
):
    """
    Logs an employee or owner action in the ActivityLog table.
    """
    try:
        org_id = get_org_id(user, db)
        amt_val = Decimal("0.00")
        if amount:
            try:
                amt_val = Decimal(str(round(float(amount), 2)))
            except Exception:
                amt_val = Decimal("0.00")

        log = models.ActivityLog(
            org_id=org_id,
            user_id=user.id,
            user_name=user.name or user.email,
            user_email=user.email,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            amount=amt_val,
        )
        db.add(log)
        db.flush()
    except Exception as e:
        print(f"[ActivityLogger] Failed to log activity: {e}")

