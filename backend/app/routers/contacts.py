from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.dependencies import require_permission
from app.models import Contact
from app.schemas import ContactResponse, ContactCreate

router = APIRouter(prefix="/contacts")


@router.post("", response_model=ContactResponse, status_code=201)
async def submit_contact(data: ContactCreate, db: AsyncSession = Depends(get_db)):
    contact = Contact(**data.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.get("", response_model=list[ContactResponse])
async def list_contacts(db: AsyncSession = Depends(get_db), user=Depends(require_permission("contacts:read"))):
    result = await db.execute(select(Contact).order_by(desc(Contact.created_at)))
    return result.scalars().all()
