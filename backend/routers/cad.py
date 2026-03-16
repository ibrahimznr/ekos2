"""
CAD Router - DWG/DXF Dosya İşleme ve Görüntüleme
Web tabanlı CAD Viewer için backend API
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import ezdxf
from ezdxf.entities import Line, Circle, Arc, LWPolyline, Polyline, Spline, Text, MText, Insert
import io
import os
import math
import uuid
from datetime import datetime, timezone

from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/cad", tags=["CAD"])


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


class CADMetadata(BaseModel):
    id: str
    filename: str
    file_path: str
    upload_date: str
    entity_count: int
    layers: List[str]
    bounds: Dict[str, float]
    related_project_id: Optional[str] = None
    related_report_id: Optional[str] = None
    description: Optional[str] = None


# Color mapping for AutoCAD color index
ACI_COLORS = {
    0: "#000000",  # ByBlock
    1: "#FF0000",  # Red
    2: "#FFFF00",  # Yellow
    3: "#00FF00",  # Green
    4: "#00FFFF",  # Cyan
    5: "#0000FF",  # Blue
    6: "#FF00FF",  # Magenta
    7: "#FFFFFF",  # White
    8: "#808080",  # Gray
    9: "#C0C0C0",  # Light Gray
    10: "#FF0000",
    11: "#FF7F7F",
    12: "#CC0000",
    30: "#FF7F00",
    40: "#FFBF00",
    50: "#FFFF00",
    70: "#7FFF00",
    90: "#00FF00",
    110: "#00FF7F",
    130: "#00FFFF",
    150: "#007FFF",
    170: "#0000FF",
    190: "#7F00FF",
    210: "#FF00FF",
    230: "#FF007F",
    250: "#333333",
    251: "#505050",
    252: "#696969",
    253: "#828282",
    254: "#BEBEBE",
    255: "#FFFFFF",
}


def get_color_from_entity(entity) -> str:
    """Get color from entity as hex string"""
    try:
        color_index = entity.dxf.color
        if color_index in ACI_COLORS:
            return ACI_COLORS[color_index]
        elif 0 <= color_index <= 255:
            # Generate color from index
            r = (color_index * 37) % 256
            g = (color_index * 73) % 256
            b = (color_index * 109) % 256
            return f"#{r:02X}{g:02X}{b:02X}"
        return "#FFFFFF"
    except:
        return "#FFFFFF"


def parse_line(entity: Line) -> CADEntity:
    """Parse LINE entity"""
    return CADEntity(
        type="line",
        color=get_color_from_entity(entity),
        layer=entity.dxf.layer,
        data={
            "start": {"x": entity.dxf.start.x, "y": entity.dxf.start.y},
            "end": {"x": entity.dxf.end.x, "y": entity.dxf.end.y}
        }
    )


def parse_circle(entity: Circle) -> CADEntity:
    """Parse CIRCLE entity"""
    return CADEntity(
        type="circle",
        color=get_color_from_entity(entity),
        layer=entity.dxf.layer,
        data={
            "center": {"x": entity.dxf.center.x, "y": entity.dxf.center.y},
            "radius": entity.dxf.radius
        }
    )


def parse_arc(entity: Arc) -> CADEntity:
    """Parse ARC entity"""
    return CADEntity(
        type="arc",
        color=get_color_from_entity(entity),
        layer=entity.dxf.layer,
        data={
            "center": {"x": entity.dxf.center.x, "y": entity.dxf.center.y},
            "radius": entity.dxf.radius,
            "start_angle": entity.dxf.start_angle,
            "end_angle": entity.dxf.end_angle
        }
    )


def parse_lwpolyline(entity: LWPolyline) -> CADEntity:
    """Parse LWPOLYLINE entity"""
    points = []
    for point in entity.get_points():
        points.append({"x": point[0], "y": point[1]})
    
    return CADEntity(
        type="polyline",
        color=get_color_from_entity(entity),
        layer=entity.dxf.layer,
        data={
            "points": points,
            "closed": entity.closed
        }
    )


def parse_polyline(entity: Polyline) -> CADEntity:
    """Parse POLYLINE entity"""
    points = []
    for vertex in entity.vertices:
        points.append({"x": vertex.dxf.location.x, "y": vertex.dxf.location.y})
    
    return CADEntity(
        type="polyline",
        color=get_color_from_entity(entity),
        layer=entity.dxf.layer,
        data={
            "points": points,
            "closed": entity.is_closed
        }
    )


def parse_spline(entity: Spline) -> CADEntity:
    """Parse SPLINE entity - convert to polyline approximation"""
    try:
        points = []
        # Get control points or fit points
        if entity.control_points:
            for point in entity.control_points:
                points.append({"x": point.x, "y": point.y})
        elif entity.fit_points:
            for point in entity.fit_points:
                points.append({"x": point.x, "y": point.y})
        
        return CADEntity(
            type="spline",
            color=get_color_from_entity(entity),
            layer=entity.dxf.layer,
            data={
                "points": points,
                "closed": entity.closed
            }
        )
    except:
        return None


def parse_text(entity) -> CADEntity:
    """Parse TEXT or MTEXT entity"""
    try:
        if hasattr(entity.dxf, 'insert'):
            x, y = entity.dxf.insert.x, entity.dxf.insert.y
        else:
            x, y = 0, 0
        
        text_content = ""
        if hasattr(entity.dxf, 'text'):
            text_content = entity.dxf.text
        elif hasattr(entity, 'text'):
            text_content = entity.text
        
        height = entity.dxf.height if hasattr(entity.dxf, 'height') else 1.0
        
        return CADEntity(
            type="text",
            color=get_color_from_entity(entity),
            layer=entity.dxf.layer,
            data={
                "position": {"x": x, "y": y},
                "text": text_content,
                "height": height
            }
        )
    except:
        return None


def calculate_bounds(entities: List[CADEntity]) -> Dict[str, float]:
    """Calculate bounding box of all entities"""
    if not entities:
        return {"min_x": 0, "min_y": 0, "max_x": 100, "max_y": 100}
    
    min_x = float('inf')
    min_y = float('inf')
    max_x = float('-inf')
    max_y = float('-inf')
    
    for entity in entities:
        data = entity.data
        
        if entity.type == "line":
            min_x = min(min_x, data["start"]["x"], data["end"]["x"])
            min_y = min(min_y, data["start"]["y"], data["end"]["y"])
            max_x = max(max_x, data["start"]["x"], data["end"]["x"])
            max_y = max(max_y, data["start"]["y"], data["end"]["y"])
            
        elif entity.type == "circle":
            min_x = min(min_x, data["center"]["x"] - data["radius"])
            min_y = min(min_y, data["center"]["y"] - data["radius"])
            max_x = max(max_x, data["center"]["x"] + data["radius"])
            max_y = max(max_y, data["center"]["y"] + data["radius"])
            
        elif entity.type == "arc":
            min_x = min(min_x, data["center"]["x"] - data["radius"])
            min_y = min(min_y, data["center"]["y"] - data["radius"])
            max_x = max(max_x, data["center"]["x"] + data["radius"])
            max_y = max(max_y, data["center"]["y"] + data["radius"])
            
        elif entity.type in ["polyline", "spline"]:
            for point in data["points"]:
                min_x = min(min_x, point["x"])
                min_y = min(min_y, point["y"])
                max_x = max(max_x, point["x"])
                max_y = max(max_y, point["y"])
                
        elif entity.type == "text":
            min_x = min(min_x, data["position"]["x"])
            min_y = min(min_y, data["position"]["y"])
            max_x = max(max_x, data["position"]["x"])
            max_y = max(max_y, data["position"]["y"])
    
    # Add padding
    padding = max(max_x - min_x, max_y - min_y) * 0.05
    
    return {
        "min_x": min_x - padding if min_x != float('inf') else 0,
        "min_y": min_y - padding if min_y != float('inf') else 0,
        "max_x": max_x + padding if max_x != float('-inf') else 100,
        "max_y": max_y + padding if max_y != float('-inf') else 100
    }


@router.post("/parse", response_model=CADParseResult)
async def parse_cad_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Parse DXF file and return entities as JSON"""
    
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
            detail="DWG dosyaları doğrudan desteklenmemektedir. Lütfen DXF formatına dönüştürün veya AutoCAD'den 'Save As DXF' yapın."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse DXF - ezdxf requires a stream that can be decoded
        stream = io.StringIO(content.decode('utf-8', errors='ignore'))
        doc = ezdxf.read(stream)
        msp = doc.modelspace()
        
        entities = []
        layers = set()
        
        # Process entities
        for entity in msp:
            parsed = None
            
            try:
                if entity.dxftype() == 'LINE':
                    parsed = parse_line(entity)
                elif entity.dxftype() == 'CIRCLE':
                    parsed = parse_circle(entity)
                elif entity.dxftype() == 'ARC':
                    parsed = parse_arc(entity)
                elif entity.dxftype() == 'LWPOLYLINE':
                    parsed = parse_lwpolyline(entity)
                elif entity.dxftype() == 'POLYLINE':
                    parsed = parse_polyline(entity)
                elif entity.dxftype() == 'SPLINE':
                    parsed = parse_spline(entity)
                elif entity.dxftype() in ['TEXT', 'MTEXT']:
                    parsed = parse_text(entity)
                
                if parsed:
                    entities.append(parsed)
                    layers.add(parsed.layer)
                    
            except Exception as e:
                # Skip problematic entities
                continue
        
        bounds = calculate_bounds(entities)
        
        return CADParseResult(
            success=True,
            entities=entities,
            bounds=bounds,
            layers=list(layers),
            entity_count=len(entities),
            message=f"{len(entities)} öğe başarıyla işlendi"
        )
        
    except ezdxf.DXFStructureError as e:
        raise HTTPException(
            status_code=400,
            detail=f"DXF dosyası bozuk veya geçersiz format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dosya işlenirken hata oluştu: {str(e)}"
        )


@router.post("/upload")
async def upload_cad_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    report_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload and store CAD file with metadata"""
    
    # Validate file
    filename = file.filename.lower()
    if not filename.endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Sadece DXF dosyaları desteklenmektedir")
    
    try:
        content = await file.read()
        
        # Parse to get metadata
        doc = ezdxf.read(io.BytesIO(content))
        msp = doc.modelspace()
        
        entity_count = len(list(msp))
        layers = list(set(e.dxf.layer for e in msp if hasattr(e.dxf, 'layer')))
        
        # Save file
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads", "cad")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Store metadata in MongoDB
        metadata = {
            "id": file_id,
            "filename": file.filename,
            "file_path": f"/uploads/cad/{safe_filename}",
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user.get("id"),
            "entity_count": entity_count,
            "layers": layers,
            "related_project_id": project_id,
            "related_report_id": report_id,
            "description": description
        }
        
        await db.cad_files.insert_one(metadata)
        
        return {
            "success": True,
            "id": file_id,
            "filename": file.filename,
            "entity_count": entity_count,
            "layers": layers,
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
    
    # Read and parse the file
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
        doc = ezdxf.readfile(file_path)
        msp = doc.modelspace()
        
        entities = []
        layers = set()
        
        for entity in msp:
            parsed = None
            
            try:
                if entity.dxftype() == 'LINE':
                    parsed = parse_line(entity)
                elif entity.dxftype() == 'CIRCLE':
                    parsed = parse_circle(entity)
                elif entity.dxftype() == 'ARC':
                    parsed = parse_arc(entity)
                elif entity.dxftype() == 'LWPOLYLINE':
                    parsed = parse_lwpolyline(entity)
                elif entity.dxftype() == 'POLYLINE':
                    parsed = parse_polyline(entity)
                elif entity.dxftype() == 'SPLINE':
                    parsed = parse_spline(entity)
                elif entity.dxftype() in ['TEXT', 'MTEXT']:
                    parsed = parse_text(entity)
                
                if parsed:
                    entities.append(parsed)
                    layers.add(parsed.layer)
                    
            except:
                continue
        
        bounds = calculate_bounds(entities)
        
        return {
            "metadata": metadata,
            "entities": [e.dict() for e in entities],
            "bounds": bounds,
            "layers": list(layers)
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
    
    # Delete file from disk
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "..",
        "uploads",
        "cad",
        os.path.basename(metadata["file_path"])
    )
    
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await db.cad_files.delete_one({"id": file_id})
    
    return {"success": True, "message": "CAD dosyası silindi"}
