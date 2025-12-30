from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta

from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Dashboard'a erişim yetkiniz yok")
    
    base_query = {}
    user_firma = current_user.get("firma_adi")
    if user_firma and current_user.get("role") == "viewer":
        base_query["firma"] = user_firma
    
    total_raporlar = await db.raporlar.count_documents(base_query)
    
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    monthly_query = {**base_query, "created_at": {"$gte": start_of_month.isoformat()}}
    monthly_raporlar = await db.raporlar.count_documents(monthly_query)
    
    uygun_count = await db.raporlar.count_documents({**base_query, "uygunluk": "Uygun"})
    uygun_degil_count = await db.raporlar.count_documents({**base_query, "uygunluk": "Uygun Değil"})
    
    now_date = now.date()
    thirty_days = (now + timedelta(days=30)).date()
    seven_days = (now + timedelta(days=7)).date()
    
    date_query = {**base_query, "gecerlilik_tarihi": {"$nin": [None, ""]}}
    raporlar_with_dates = await db.raporlar.find(
        date_query, 
        {"gecerlilik_tarihi": 1, "_id": 0}
    ).limit(5000).to_list(5000)
    
    expiring_30_days = 0
    expiring_7_days = 0
    
    for rapor in raporlar_with_dates:
        gecerlilik_str = rapor.get("gecerlilik_tarihi")
        if gecerlilik_str and str(gecerlilik_str).strip():
            try:
                from datetime import datetime as dt
                gecerlilik = None
                for fmt in ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]:
                    try:
                        gecerlilik = dt.strptime(str(gecerlilik_str), fmt).date()
                        break
                    except ValueError:
                        continue
                
                if gecerlilik:
                    if now_date <= gecerlilik <= thirty_days:
                        expiring_30_days += 1
                    if now_date <= gecerlilik <= seven_days:
                        expiring_7_days += 1
            except Exception:
                continue
    
    pipeline = []
    if base_query:
        pipeline.append({"$match": base_query})
    pipeline.extend([
        {"$group": {"_id": "$kategori", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 6},
        {"$project": {"kategori": "$_id", "count": 1, "_id": 0}}
    ])
    
    kategori_dagilim = await db.raporlar.aggregate(pipeline).to_list(6)
    
    # İskele stats
    iskele_query = {}
    if current_user.get("role") == "viewer" and current_user.get("firma_adi"):
        iskele_query["firma_adi"] = current_user.get("firma_adi")
    
    total_pipeline = []
    if iskele_query:
        total_pipeline.append({"$match": iskele_query})
    total_pipeline.append({"$group": {"_id": None, "total": {"$sum": "$bileşen_adedi"}}})
    
    total_result = await db.iskele_bilesenleri.aggregate(total_pipeline).to_list(1)
    total_iskele = total_result[0]["total"] if total_result else 0
    
    # Uygun olanların bileşen adedi toplamı - case-insensitive regex
    uygun_pipeline = []
    if iskele_query:
        uygun_pipeline.append({"$match": iskele_query})
    uygun_pipeline.extend([
        {"$match": {"uygunluk": {"$regex": "^uygun$", "$options": "i"}}},
        {"$group": {"_id": None, "total": {"$sum": "$bileşen_adedi"}}}
    ])
    
    uygun_result = await db.iskele_bilesenleri.aggregate(uygun_pipeline).to_list(1)
    iskele_uygun = uygun_result[0]["total"] if uygun_result else 0
    
    # Uygun olmayanların bileşen adedi toplamı - case-insensitive regex
    uygun_degil_pipeline = []
    if iskele_query:
        uygun_degil_pipeline.append({"$match": iskele_query})
    uygun_degil_pipeline.extend([
        {"$match": {"uygunluk": {"$regex": "uygun.*(de[ğg]il|olmayan)", "$options": "i"}}},
        {"$group": {"_id": None, "total": {"$sum": "$bileşen_adedi"}}}
    ])
    
    uygun_degil_result = await db.iskele_bilesenleri.aggregate(uygun_degil_pipeline).to_list(1)
    iskele_uygun_degil = uygun_degil_result[0]["total"] if uygun_degil_result else 0
    
    iskele_pipeline = []
    if iskele_query:
        iskele_pipeline.append({"$match": iskele_query})
    iskele_pipeline.extend([
        {"$group": {"_id": "$bileşen_adi", "count": {"$sum": "$bileşen_adedi"}}},
        {"$sort": {"count": -1}},
        {"$limit": 6},
        {"$project": {"bileşen_adi": "$_id", "count": 1, "_id": 0}}
    ])
    
    bilesen_dagilim = await db.iskele_bilesenleri.aggregate(iskele_pipeline).to_list(6)
    
    return {
        "total_raporlar": total_raporlar,
        "monthly_raporlar": monthly_raporlar,
        "uygun_count": uygun_count,
        "uygun_degil_count": uygun_degil_count,
        "expiring_30_days": expiring_30_days,
        "expiring_7_days": expiring_7_days,
        "kategori_dagilim": kategori_dagilim,
        "iskele_stats": {
            "total": total_iskele,
            "uygun": iskele_uygun,
            "uygun_degil": iskele_uygun_degil,
            "uygunluk_orani": round((iskele_uygun / total_iskele * 100), 1) if total_iskele > 0 else 0,
            "bilesen_dagilim": bilesen_dagilim
        }
    }
