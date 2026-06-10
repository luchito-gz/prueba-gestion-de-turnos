from fastapi import APIRouter, Request, Response, Depends
from twilio.twiml.messaging_response import MessagingResponse
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.chatbot_service import procesar_mensaje
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    incoming_msg = form_data.get("Body", "").strip()
    from_number = form_data.get("From", "")

    logger.info(f"[WEBHOOK] De: {from_number} | Mensaje: {incoming_msg}")

    respuesta = procesar_mensaje(from_number, incoming_msg, db)

    resp = MessagingResponse()
    resp.message(respuesta)
    return Response(content=str(resp), media_type="application/xml")
