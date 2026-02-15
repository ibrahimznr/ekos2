"""
Kombinasyonlar Router - Şans Topu Tahmin Üretici
Rastgele kombinasyon üretme, arama ve Excel'e kaydetme işlemleri
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
import io
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

router = APIRouter(prefix="/kombinasyonlar", tags=["Kombinasyonlar"])

# Global cache for combinations
COMBINATIONS_CACHE: Dict[int, List[int]] = {}


class GenerateRequest(BaseModel):
    num_combinations: int = 1000000
    seed: Optional[int] = None


class SearchRequest(BaseModel):
    combination_str: str


class FilterRequest(BaseModel):
    main_numbers: List[int]
    bonus_number: Optional[int] = None


class GenerateResponse(BaseModel):
    generated_count: int
    total_count: int
    message: str


class SearchResult(BaseModel):
    found: bool
    indices: List[int]
    combination: Optional[List[int]]
    message: str


class CombinationItem(BaseModel):
    index: int
    main_numbers: List[int]
    bonus_number: int
    formatted: str


class StatsResponse(BaseModel):
    total_combinations: int


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get current combination statistics"""
    return {"total_combinations": len(COMBINATIONS_CACHE)}


@router.post("/generate", response_model=GenerateResponse)
async def generate_combinations(request: GenerateRequest):
    """Generate new combinations and add to cache"""
    global COMBINATIONS_CACHE
    
    if request.seed:
        random.seed(request.seed)
    
    num = request.num_combinations
    if num <= 0:
        raise HTTPException(status_code=400, detail="Kombinasyon sayısı pozitif olmalıdır")
    
    if num > 10000000:
        raise HTTPException(status_code=400, detail="Maksimum 10 milyon kombinasyon üretilebilir")
    
    start_index = len(COMBINATIONS_CACHE) + 1
    
    for i in range(start_index, start_index + num):
        main_numbers = random.sample(range(1, 35), 5)
        main_numbers.sort()
        bonus_number = random.randint(1, 14)
        combination = main_numbers + [bonus_number]
        COMBINATIONS_CACHE[i] = combination
    
    return {
        "generated_count": num,
        "total_count": len(COMBINATIONS_CACHE),
        "message": f"{num:,} kombinasyon başarıyla oluşturuldu. Toplam: {len(COMBINATIONS_CACHE):,}"
    }


@router.post("/clear")
async def clear_cache():
    """Clear all combinations from cache"""
    global COMBINATIONS_CACHE
    count = len(COMBINATIONS_CACHE)
    COMBINATIONS_CACHE.clear()
    return {
        "cleared_count": count,
        "message": f"{count:,} kombinasyon silindi. Önbellek temizlendi."
    }


@router.post("/search", response_model=SearchResult)
async def search_combination(request: SearchRequest):
    """Search for a combination in cache"""
    global COMBINATIONS_CACHE
    
    if not COMBINATIONS_CACHE:
        return {
            "found": False,
            "indices": [],
            "combination": None,
            "message": "Cache boş! Önce kombinasyon oluşturun."
        }
    
    combination_str = request.combination_str.strip()
    
    try:
        # Parse different formats
        if '+' in combination_str:
            # Format: 5,12,23,27,34+8
            main_part, bonus_part = combination_str.split('+')
            main_numbers = [int(num.strip()) for num in main_part.split(',')]
            bonus_number = int(bonus_part.strip())
        elif '-' in combination_str and combination_str.count('-') >= 4:
            # Format: 5-12-23-27-34-8
            numbers = [int(num.strip()) for num in combination_str.split('-')]
            main_numbers = numbers[:5]
            bonus_number = numbers[5]
        else:
            # Format: 5 12 23 27 34 8 or 5,12,23,27,34,8
            numbers = [int(num.strip()) for num in combination_str.replace(',', ' ').split()]
            if len(numbers) != 6:
                return {
                    "found": False,
                    "indices": [],
                    "combination": None,
                    "message": "Geçersiz format! 6 sayı girmelisiniz (5 ana + 1 bonus)."
                }
            main_numbers = numbers[:5]
            bonus_number = numbers[5]
        
        # Validate numbers
        if len(main_numbers) != 5:
            return {
                "found": False,
                "indices": [],
                "combination": None,
                "message": "5 ana sayı girilmelidir."
            }
        
        if any(num < 1 or num > 34 for num in main_numbers):
            return {
                "found": False,
                "indices": [],
                "combination": None,
                "message": "Ana sayılar 1-34 arasında olmalıdır."
            }
        
        if len(set(main_numbers)) != 5:
            return {
                "found": False,
                "indices": [],
                "combination": None,
                "message": "Ana sayılar birbirinden farklı olmalıdır."
            }
        
        if bonus_number < 1 or bonus_number > 14:
            return {
                "found": False,
                "indices": [],
                "combination": None,
                "message": "Bonus sayı 1-14 arasında olmalıdır."
            }
        
        # Sort and create target
        main_numbers.sort()
        target_combination = main_numbers + [bonus_number]
        
        # Search in cache
        found_indices = []
        for idx, comb in COMBINATIONS_CACHE.items():
            if comb == target_combination:
                found_indices.append(idx)
        
        if found_indices:
            return {
                "found": True,
                "indices": found_indices[:100],  # Return max 100 results
                "combination": target_combination,
                "message": f"Kombinasyon {len(found_indices)} kez bulundu!"
            }
        else:
            return {
                "found": False,
                "indices": [],
                "combination": target_combination,
                "message": "Kombinasyon bulunamadı."
            }
            
    except ValueError:
        return {
            "found": False,
            "indices": [],
            "combination": None,
            "message": "Geçersiz sayı formatı!"
        }
    except Exception as e:
        return {
            "found": False,
            "indices": [],
            "combination": None,
            "message": f"Arama hatası: {str(e)}"
        }


@router.get("/sample", response_model=List[CombinationItem])
async def get_sample_combinations(count: int = 5):
    """Get random sample of combinations"""
    global COMBINATIONS_CACHE
    
    if not COMBINATIONS_CACHE:
        return []
    
    sample_count = min(count, len(COMBINATIONS_CACHE))
    sample_indices = random.sample(list(COMBINATIONS_CACHE.keys()), sample_count)
    
    results = []
    for idx in sorted(sample_indices):
        comb = COMBINATIONS_CACHE[idx]
        results.append({
            "index": idx,
            "main_numbers": comb[:5],
            "bonus_number": comb[5],
            "formatted": f"{comb[0]},{comb[1]},{comb[2]},{comb[3]},{comb[4]}+{comb[5]}"
        })
    
    return results


@router.get("/combination/{index}", response_model=CombinationItem)
async def get_combination(index: int):
    """Get a specific combination by index"""
    global COMBINATIONS_CACHE
    
    if index not in COMBINATIONS_CACHE:
        raise HTTPException(
            status_code=404, 
            detail=f"{index}. kombinasyon bulunamadı! Lütfen 1-{len(COMBINATIONS_CACHE)} arasında bir sayı girin."
        )
    
    comb = COMBINATIONS_CACHE[index]
    return {
        "index": index,
        "main_numbers": comb[:5],
        "bonus_number": comb[5],
        "formatted": f"{comb[0]},{comb[1]},{comb[2]},{comb[3]},{comb[4]}+{comb[5]}"
    }


@router.get("/export-excel")
async def export_to_excel():
    """Export all combinations to Excel file"""
    global COMBINATIONS_CACHE
    
    if not COMBINATIONS_CACHE:
        raise HTTPException(status_code=400, detail="Önce kombinasyon oluşturmanız gerekiyor!")
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Kombinasyonlar"
    
    # Styles
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    cell_font = Font(name="Arial", size=10)
    center_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Headers
    headers = ["Sıra", "Sayı 1", "Sayı 2", "Sayı 3", "Sayı 4", "Sayı 5", "Bonus", "Format"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border
    
    # Data - limit to first 100000 for performance
    max_rows = min(100000, len(COMBINATIONS_CACHE))
    sorted_keys = sorted(COMBINATIONS_CACHE.keys())[:max_rows]
    
    for row_idx, key in enumerate(sorted_keys, 2):
        comb = COMBINATIONS_CACHE[key]
        row_data = [
            key,
            comb[0], comb[1], comb[2], comb[3], comb[4],
            comb[5],
            f"{comb[0]},{comb[1]},{comb[2]},{comb[3]},{comb[4]}+{comb[5]}"
        ]
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col, value=value)
            cell.font = cell_font
            cell.alignment = center_align
            cell.border = thin_border
    
    # Auto-width columns
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(col)].width = 12
    ws.column_dimensions['H'].width = 20  # Format column wider
    
    # Freeze header row
    ws.freeze_panes = 'A2'
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"sans_topu_kombinasyonlari_{len(COMBINATIONS_CACHE)}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
