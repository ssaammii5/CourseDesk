from sqlalchemy.orm import Mapped, mapped_column

from app.utils.db import Base


class AppSettingModel(Base):
    __tablename__: str = "app_setting_table"

    key: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(default="")
    description: Mapped[str] = mapped_column(default="")
    category: Mapped[str] = mapped_column(default="General")