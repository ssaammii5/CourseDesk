from sqlalchemy import select
from sqlalchemy.orm import Session

from app.setting.dtos import AppSettingSchema
from app.setting.models import AppSettingModel


def get_settings(db: Session):
    return list(db.scalars(select(AppSettingModel)).all())


def upsert_setting(body: AppSettingSchema, db: Session):
    setting = db.get(AppSettingModel, body.key)
    if setting:
        setting.value = body.value
        setting.description = body.description
        setting.category = body.category
    else:
        setting = AppSettingModel(
            key=body.key,
            value=body.value,
            description=body.description,
            category=body.category,
        )
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting