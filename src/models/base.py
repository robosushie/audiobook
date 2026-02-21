"""Base helpers for all SQLModel models."""

from sqlalchemy import MetaData
from sqlmodel import SQLModel

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# Configure SQLModel metadata with naming convention
SQLModel.metadata = MetaData(naming_convention=NAMING_CONVENTION)

# Base class for all SQLModel models
Base = SQLModel
