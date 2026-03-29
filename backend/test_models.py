from app.db.base import Base
from app.models.user import User
from app.models.claim import Claim
from app.models.denial import Denial, Appeal
from sqlalchemy.orm import configure_mappers

try:
    configure_mappers()
    print("Mappers configured successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
