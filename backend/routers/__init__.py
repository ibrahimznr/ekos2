from .auth import router as auth_router
from .kategoriler import router as kategoriler_router
from .raporlar import router as raporlar_router
from .files import router as files_router
from .excel import router as excel_router
from .dashboard import router as dashboard_router
from .users import router as users_router
from .projeler import router as projeler_router
from .iskele import router as iskele_router

__all__ = [
    'auth_router',
    'kategoriler_router',
    'raporlar_router',
    'files_router',
    'excel_router',
    'dashboard_router',
    'users_router',
    'projeler_router',
    'iskele_router'
]
