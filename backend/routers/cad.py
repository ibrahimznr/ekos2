"""
CAD Router - DWG/DXF Dosya İşleme ve Görüntüleme
Optimized Version with Binary DXF Support and Background Processing
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import ezdxf
from ezdxf import recover
from ezdxf.entities import Line, Circle, Arc, LWPolyline, Polyline, Spline, Text, MText
import io
import os
import math
import uuid
import asyncio
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/cad", tags=["CAD"])

# Thread pool for CPU-intensive DXF parsing
executor = ThreadPoolExecutor(max_workers=2)

# Progress tracking for background tasks
processing_tasks = {}


class CADEntity(BaseModel):
    type: str
    color: Optional[str] = "#FFFFFF"
    layer: Optional[str] = "0"
    data: Dict[str, Any]


class CADParseResult(BaseModel):
    success: bool
    entities: List[CADEntity]
    bounds: Dict[str, float]
    layers: List[str]
    entity_count: int
    message: str


class ProcessingStatus(BaseModel):
    task_id: str
    status: str  # pending, processing, completed, error
    progress: int
    message: str
    entity_count: Optional[int] = None
    layers: Optional[List[str]] = None


# AutoCAD Color Index mapping
ACI_COLORS = {
    0: "#000000", 1: "#FF0000", 2: "#FFFF00", 3: "#00FF00",
    4: "#00FFFF", 5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF",
    8: "#808080", 9: "#C0C0C0", 10: "#FF0000", 250: "#333333",
    251: "#505050", 252: "#696969", 253: "#828282", 254: "#BEBEBE", 255: "#FFFFFF",
}


def get_color_from_entity(entity) -> str:
    """Get color from entity as hex string"""
    try:
        color_index = entity.dxf.color
        if color_index in ACI_COLORS:
            return ACI_COLORS[color_index]
        elif 0 <= color_index <= 255:
            r = (color_index * 37) % 256
            g = (color_index * 73) % 256
            b = (color_index * 109) % 256
            return f"#{r:02X}{g:02X}{b:02X}"
        return "#FFFFFF"
    except:
        return "#FFFFFF"


def parse_entity(entity) -> Optional[CADEntity]:
    """Parse a single DXF entity to CADEntity - Optimized"""
    try:
        entity_type = entity.dxftype()
        color = get_color_from_entity(entity)
        layer = entity.dxf.layer if hasattr(entity.dxf, 'layer') else "0"
        
        if entity_type == 'LINE':
            return CADEntity(
                type="line",
                color=color,
                layer=layer,
                data={
                    "start": {"x": float(entity.dxf.start.x), "y": float(entity.dxf.start.y)},
                    "end": {"x": float(entity.dxf.end.x), "y": float(entity.dxf.end.y)}
                }
            )
            
        elif entity_type == 'CIRCLE':
            return CADEntity(
                type="circle",
                color=color,
                layer=layer,
                data={
                    "center": {"x": float(entity.dxf.center.x), "y": float(entity.dxf.center.y)},
                    "radius": float(entity.dxf.radius)
                }
            )
            
        elif entity_type == 'ARC':
            return CADEntity(
                type="arc",
                color=color,
                layer=layer,
                data={
                    "center": {"x": float(entity.dxf.center.x), "y": float(entity.dxf.center.y)},
                    "radius": float(entity.dxf.radius),
                    "start_angle": float(entity.dxf.start_angle),
                    "end_angle": float(entity.dxf.end_angle)
                }
            )
            
        elif entity_type == 'LWPOLYLINE':
            points = [{"x": float(p[0]), "y": float(p[1])} for p in entity.get_points()]
            if len(points) < 2:
                return None
            return CADEntity(
                type="polyline",
                color=color,
                layer=layer,
                data={"points": points, "closed": entity.closed}
            )
            
        elif entity_type == 'POLYLINE':
            points = []
            for vertex in entity.vertices:
                try:
                    points.append({"x": float(vertex.dxf.location.x), "y": float(vertex.dxf.location.y)})
                except:
                    continue
            if len(points) < 2:
                return None
            return CADEntity(
                type="polyline",
                color=color,
                layer=layer,
                data={"points": points, "closed": entity.is_closed}
            )
            
        elif entity_type == 'SPLINE':
            points = []
            if hasattr(entity, 'control_points') and entity.control_points:
                points = [{"x": float(p.x), "y": float(p.y)} for p in entity.control_points]
            elif hasattr(entity, 'fit_points') and entity.fit_points:
                points = [{"x": float(p.x), "y": float(p.y)} for p in entity.fit_points]
            if len(points) < 2:
                return None
            return CADEntity(
                type="spline",
                color=color,
                layer=layer,
                data={"points": points, "closed": getattr(entity, 'closed', False)}
            )
            
        elif entity_type in ['TEXT', 'MTEXT']:
            x, y = 0.0, 0.0
            if hasattr(entity.dxf, 'insert'):
                x, y = float(entity.dxf.insert.x), float(entity.dxf.insert.y)
            text_content = ""
            if hasattr(entity.dxf, 'text'):
                text_content = str(entity.dxf.text)
            elif hasattr(entity, 'text'):
                text_content = str(entity.text)
            height = float(entity.dxf.height) if hasattr(entity.dxf, 'height') else 1.0
            
            return CADEntity(
                type="text",
                color=color,
                layer=layer,
                data={"position": {"x": x, "y": y}, "text": text_content, "height": height}
            )
            
    except Exception as e:
        pass
    
    return None


def calculate_bounds(entities: List[CADEntity]) -> Dict[str, float]:
    """Calculate bounding box of all entities - Optimized"""
    if not entities:
        return {"min_x": 0, "min_y": 0, "max_x": 100, "max_y": 100}
    
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')
    
    for entity in entities:
        data = entity.data
        etype = entity.type
        
        if etype == "line":
            xs = [data["start"]["x"], data["end"]["x"]]
            ys = [data["start"]["y"], data["end"]["y"]]
            min_x, max_x = min(min_x, *xs), max(max_x, *xs)
            min_y, max_y = min(min_y, *ys), max(max_y, *ys)
            
        elif etype in ["circle", "arc"]:
            cx, cy, r = data["center"]["x"], data["center"]["y"], data["radius"]
            min_x, max_x = min(min_x, cx - r), max(max_x, cx + r)
            min_y, max_y = min(min_y, cy - r), max(max_y, cy + r)
            
        elif etype in ["polyline", "spline"]:
            for p in data["points"]:
                min_x, max_x = min(min_x, p["x"]), max(max_x, p["x"])
                min_y, max_y = min(min_y, p["y"]), max(max_y, p["y"])
                
        elif etype == "text":
            px, py = data["position"]["x"], data["position"]["y"]
            min_x, max_x = min(min_x, px), max(max_x, px)
            min_y, max_y = min(min_y, py), max(max_y, py)
    
    # Add padding
    width = max_x - min_x if max_x > min_x else 100
    height = max_y - min_y if max_y > min_y else 100
    padding = max(width, height) * 0.05
    
    return {
        "min_x": min_x - padding if min_x != float('inf') else 0,
        "min_y": min_y - padding if min_y != float('inf') else 0,
        "max_x": max_x + padding if max_x != float('-inf') else 100,
        "max_y": max_y + padding if max_y != float('-inf') else 100
    }


def parse_dxf_file_sync(content: bytes, max_entities: int = 50000) -> Dict:
    """
    Synchronous DXF parsing with Binary DXF support and recovery mode
    Optimized for large files with entity limit
    """
    doc = None
    auditor = None
    is_recovered = False
    
    # Try multiple parsing strategies
    parsing_strategies = [
        # Strategy 1: Direct binary read
        lambda: ezdxf.read(io.BytesIO(content)),
        # Strategy 2: Recovery mode for corrupted files
        lambda: recover.readfile(io.BytesIO(content))[0],
        # Strategy 3: UTF-8 decoded string (ASCII DXF)
        lambda: ezdxf.read(io.StringIO(content.decode('utf-8', errors='ignore'))),
        # Strategy 4: Latin-1 decoded string
        lambda: ezdxf.read(io.StringIO(content.decode('latin-1', errors='ignore'))),
        # Strategy 5: CP1252 (Windows) decoded string
        lambda: ezdxf.read(io.StringIO(content.decode('cp1252', errors='ignore'))),
    ]
    
    last_error = None
    for i, strategy in enumerate(parsing_strategies):
        try:
            result = strategy()
            if isinstance(result, tuple):
                doc, auditor = result
                is_recovered = True
            else:
                doc = result
            break
        except Exception as e:
            last_error = e
            continue
    
    if doc is None:
        raise Exception(f"Tüm okuma yöntemleri başarısız: {str(last_error)}")
    
    # Get modelspace
    msp = doc.modelspace()
    
    # Supported entity types for filtering
    SUPPORTED_TYPES = {'LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'TEXT', 'MTEXT'}
    
    entities = []
    layers = set()
    processed = 0
    skipped = 0
    
    # Process entities with limit
    for entity in msp:
        if processed >= max_entities:
            break
            
        try:
            if entity.dxftype() not in SUPPORTED_TYPES:
                continue
                
            parsed = parse_entity(entity)
            if parsed:
                entities.append(parsed)
                layers.add(parsed.layer)
                processed += 1
            else:
                skipped += 1
        except:
            skipped += 1
            continue
    
    bounds = calculate_bounds(entities)
    
    return {
        "success": True,
        "entities": entities,
        "bounds": bounds,
        "layers": list(layers),
        "entity_count": len(entities),
        "skipped_count": skipped,
        "is_recovered": is_recovered,
        "message": f"{len(entities)} öğe işlendi" + (f" (kurtarma modunda)" if is_recovered else "")
    }


@router.post("/parse", response_model=CADParseResult)
async def parse_cad_file(
    file: UploadFile = File(...),
    max_entities: int = 50000,
    current_user: dict = Depends(get_current_user)
):
    """
    Parse DXF file with Binary DXF support and optimized processing
    Supports both ASCII and Binary DXF formats
    """
    
    # Validate file extension
    filename = file.filename.lower()
    if not filename.endswith(('.dxf', '.dwg')):
        raise HTTPException(
            status_code=400, 
            detail="Desteklenmeyen dosya formatı. Sadece DXF dosyaları desteklenmektedir."
        )
    
    if filename.endswith('.dwg'):
        raise HTTPException(
            status_code=400,
            detail="DWG dosyaları doğrudan desteklenmemektedir. Lütfen AutoCAD'den 'Save As DXF' ile dönüştürün."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Dosya boş")
        
        # Run parsing in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor, 
            parse_dxf_file_sync, 
            content,
            max_entities
        )
        
        return CADParseResult(
            success=result["success"],
            entities=result["entities"],
            bounds=result["bounds"],
            layers=result["layers"],
            entity_count=result["entity_count"],
            message=result["message"]
        )
        
    except ezdxf.DXFStructureError as e:
        raise HTTPException(
            status_code=400,
            detail=f"DXF dosyası bozuk: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dosya işlenirken hata: {str(e)}"
        )


@router.post("/parse-async")
async def parse_cad_file_async(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Async DXF parsing for large files
    Returns task_id immediately and processes in background
    """
    
    filename = file.filename.lower()
    if not filename.endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Sadece DXF dosyaları desteklenmektedir")
    
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Dosya boş")
    
    # Create task ID
    task_id = str(uuid.uuid4())
    
    # Initialize task status
    processing_tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "message": "İşlem sıraya alındı",
        "filename": file.filename,
        "result": None
    }
    
    # Add background task
    background_tasks.add_task(process_dxf_background, task_id, content)
    
    return {"task_id": task_id, "status": "pending", "message": "İşlem başlatıldı"}


async def process_dxf_background(task_id: str, content: bytes):
    """Background task for DXF processing"""
    try:
        processing_tasks[task_id]["status"] = "processing"
        processing_tasks[task_id]["progress"] = 10
        processing_tasks[task_id]["message"] = "Dosya işleniyor..."
        
        # Run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, parse_dxf_file_sync, content, 100000)
        
        processing_tasks[task_id]["status"] = "completed"
        processing_tasks[task_id]["progress"] = 100
        processing_tasks[task_id]["message"] = result["message"]
        processing_tasks[task_id]["result"] = result
        
    except Exception as e:
        processing_tasks[task_id]["status"] = "error"
        processing_tasks[task_id]["message"] = str(e)


@router.get("/parse-status/{task_id}")
async def get_parse_status(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get status of async parsing task"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    task = processing_tasks[task_id]
    
    response = {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "message": task["message"]
    }
    
    if task["status"] == "completed" and task["result"]:
        response["entity_count"] = task["result"]["entity_count"]
        response["layers"] = task["result"]["layers"]
    
    return response


@router.get("/parse-result/{task_id}")
async def get_parse_result(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get result of completed async parsing task"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    
    task = processing_tasks[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Görev henüz tamamlanmadı: {task['status']}")
    
    result = task["result"]
    
    # Clean up task after retrieval
    del processing_tasks[task_id]
    
    return CADParseResult(
        success=result["success"],
        entities=result["entities"],
        bounds=result["bounds"],
        layers=result["layers"],
        entity_count=result["entity_count"],
        message=result["message"]
    )


@router.post("/parse-paginated")
async def parse_cad_file_paginated(
    file: UploadFile = File(...),
    page: int = 1,
    page_size: int = 5000,
    current_user: dict = Depends(get_current_user)
):
    """
    Paginated DXF parsing for very large files
    Returns entities in chunks for lazy loading
    """
    
    filename = file.filename.lower()
    if not filename.endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Sadece DXF dosyaları desteklenmektedir")
    
    content = await file.read()
    
    try:
        loop = asyncio.get_event_loop()
        
        # Parse all entities first (cached for subsequent requests in production)
        full_result = await loop.run_in_executor(executor, parse_dxf_file_sync, content, 100000)
        
        all_entities = full_result["entities"]
        total_count = len(all_entities)
        total_pages = math.ceil(total_count / page_size)
        
        # Paginate
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_entities = all_entities[start_idx:end_idx]
        
        return {
            "success": True,
            "entities": page_entities,
            "bounds": full_result["bounds"],
            "layers": full_result["layers"],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_entities": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "message": f"Sayfa {page}/{total_pages} - {len(page_entities)} öğe"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya işlenirken hata: {str(e)}")


@router.post("/upload")
async def upload_cad_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    report_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload and store CAD file with metadata"""
    
    filename = file.filename.lower()
    if not filename.endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Sadece DXF dosyaları desteklenmektedir")
    
    try:
        content = await file.read()
        
        # Quick parse to get metadata
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, parse_dxf_file_sync, content, 10000)
        
        # Save file
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads", "cad")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Store metadata
        metadata = {
            "id": file_id,
            "filename": file.filename,
            "file_path": f"/uploads/cad/{safe_filename}",
            "file_size": len(content),
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user.get("id"),
            "entity_count": result["entity_count"],
            "layers": result["layers"],
            "bounds": result["bounds"],
            "related_project_id": project_id,
            "related_report_id": report_id,
            "description": description
        }
        
        await db.cad_files.insert_one(metadata)
        
        return {
            "success": True,
            "id": file_id,
            "filename": file.filename,
            "entity_count": result["entity_count"],
            "layers": result["layers"],
            "message": "CAD dosyası başarıyla yüklendi"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya yüklenirken hata: {str(e)}")


@router.get("/files")
async def list_cad_files(
    project_id: Optional[str] = None,
    report_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all CAD files"""
    query = {}
    if project_id:
        query["related_project_id"] = project_id
    if report_id:
        query["related_report_id"] = report_id
    
    files = await db.cad_files.find(query, {"_id": 0}).to_list(None)
    return files


@router.get("/file/{file_id}")
async def get_cad_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Get CAD file metadata and parsed content"""
    
    metadata = await db.cad_files.find_one({"id": file_id}, {"_id": 0})
    if not metadata:
        raise HTTPException(status_code=404, detail="CAD dosyası bulunamadı")
    
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 
        "..", 
        "uploads", 
        "cad",
        os.path.basename(metadata["file_path"])
    )
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="CAD dosyası sunucuda bulunamadı")
    
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, parse_dxf_file_sync, content, 50000)
        
        return {
            "metadata": metadata,
            "entities": [e.dict() for e in result["entities"]],
            "bounds": result["bounds"],
            "layers": result["layers"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya işlenirken hata: {str(e)}")


@router.delete("/file/{file_id}")
async def delete_cad_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a CAD file"""
    if current_user.get("role") not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    metadata = await db.cad_files.find_one({"id": file_id})
    if not metadata:
        raise HTTPException(status_code=404, detail="CAD dosyası bulunamadı")
    
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "..",
        "uploads",
        "cad",
        os.path.basename(metadata["file_path"])
    )
    
    if os.path.exists(file_path):
        os.remove(file_path)
    
    await db.cad_files.delete_one({"id": file_id})
    
    return {"success": True, "message": "CAD dosyası silindi"}
