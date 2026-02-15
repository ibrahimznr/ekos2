from .auth import router as auth_router
from .kategoriler import router as kategoriler_router
from .raporlar import router as raporlar_router
from .files import router as files_router
from .excel import router as excel_router
from .dashboard import router as dashboard_router
from .users import router as users_router
from .projeler import router as projeler_router
from .iskele import router as iskele_router
from .static import router as static_router
from .kalibrasyon import router as kalibrasyon_router
from .ayarlar import router as ayarlar_router
from .makineler import router as makineler_router
from .operatorler import router as operatorler_router
from .cephe_iskeleleri import router as cephe_iskeleleri_router
from .draws import router as draws_router
from .vocabulary import router as vocabulary_router
from .notifications import router as notifications_router

__all__ = [
    'auth_router',
    'kategoriler_router',
    'raporlar_router',
    'files_router',
    'excel_router',
    'dashboard_router',
    'users_router',
    'projeler_router',
    'iskele_router',
    'static_router',
    'kalibrasyon_router',
    'ayarlar_router',
    'makineler_router',
    'operatorler_router',
    'cephe_iskeleleri_router',
    'draws_router',
    'vocabulary_router',
    'notifications_router'
]
