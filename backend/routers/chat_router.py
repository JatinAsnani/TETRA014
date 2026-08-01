from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from deps import get_current_user
from ai.intent_router import process_chat_message
from ai.report_explainer import explain_report
import models
import schemas

router = APIRouter()


class ExplainBody(BaseModel):
    report_type: str
    report_data: dict

@router.post("", response_model=schemas.ChatResponse)
async def send_message(
    data: schemas.ChatMessage,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == user.id)
        .order_by(models.ChatHistory.created_at)
        .all()
    )
    chat_history = [{"role": h.role.value, "content": h.message} for h in history]

    db.add(models.ChatHistory(user_id=user.id, role=models.ChatRole.user, message=data.message))
    db.commit()

    result = await process_chat_message(data.message, chat_history, user.id, db)

    db.add(models.ChatHistory(
        user_id=user.id,
        role=models.ChatRole.assistant,
        message=result["reply"],
        action_taken=result.get("action"),
    ))
    db.commit()

    return result


@router.get("/history", response_model=list[schemas.ChatHistoryItem])
def get_history(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == user.id)
        .order_by(models.ChatHistory.created_at)
        .all()
    )


@router.post("/explain")
async def explain(
    body: ExplainBody,
    user: models.User = Depends(get_current_user),
):
    explanation = await explain_report(body.report_data, body.report_type)
    return {"explanation": explanation}
