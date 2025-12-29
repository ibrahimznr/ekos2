from datetime import datetime, timezone
from constants import SEHIRLER
from database import db

def get_sehir_kodu(sehir_ismi: str) -> str:
    """Get city code from city name"""
    for sehir in SEHIRLER:
        if sehir['isim'] == sehir_ismi:
            return sehir['kod']
    return "XXX"  # Default if not found

async def generate_rapor_no(sehir: str):
    """
    Generate report number in format: PKYYYY-SEHIRKODU###
    Example: PK2025-ANK025 (for Ankara)
    """
    now = datetime.now(timezone.utc)
    year = now.strftime("%Y")
    
    # Get city code from city name
    sehir_kodu = get_sehir_kodu(sehir)
    prefix = f"PK{year}-{sehir_kodu}"
    
    # Get the last report for this city and year
    last_report = await db.raporlar.find_one(
        {"rapor_no": {"$regex": f"^{prefix}"}},
        sort=[("created_at", -1)]
    )
    
    if last_report:
        last_no_str = last_report["rapor_no"].split(sehir_kodu)[-1]
        last_no = int(last_no_str)
        new_no = last_no + 1
    else:
        new_no = 1
    
    return f"{prefix}{str(new_no).zfill(3)}"
