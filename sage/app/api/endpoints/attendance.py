# app/api/endpoints/attendance.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from app.services.analytics_service import record_query
# Import attendance service
try:
    from app.services.attendance_service import (
        process_attendance_image, 
        get_attendance_stats, 
        export_attendance_data
    )
    ATTENDANCE_AVAILABLE = True
except ImportError as e:
    print(f"Attendance service import error: {e}")
    ATTENDANCE_AVAILABLE = False
    
    # Create dummy functions
    async def process_attendance_image(image_data: bytes) -> Dict:
        return {
            'headcount': 0,
            'faces_detected': [],
            'timestamp': '',
            'session_id': None,
            'annotated_image_url': None,
            'error': 'Attendance service not available'
        }
    
    async def get_attendance_stats() -> Dict:
        return {
            'total_records': 0,
            'average_attendance': 0,
            'max_attendance': 0,
            'min_attendance': 0,
            'recent_records': []
        }
    
    def export_attendance_data() -> str:
        return None

router = APIRouter()

class AttendanceResponse(BaseModel):
    headcount: int
    faces_detected: List[Dict]
    timestamp: str
    session_id: Optional[str]
    annotated_image_url: Optional[str]
    error: Optional[str] = None

class AttendanceStats(BaseModel):
    total_records: int
    average_attendance: float
    max_attendance: int
    min_attendance: int
    recent_records: List[Dict]

class ManualAttendanceRequest(BaseModel):
    headcount: int
    notes: Optional[str] = None

@router.post("/attendance/upload", response_model=AttendanceResponse)
async def upload_attendance_image(file: UploadFile = File(...)):
    """Upload image for automatic headcount detection"""
    try:
        if not ATTENDANCE_AVAILABLE:
            raise HTTPException(status_code=503, detail="Attendance service not available")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Process attendance
        result = await process_attendance_image(image_data)
        
        return AttendanceResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@router.get("/attendance/stats", response_model=AttendanceStats)
async def get_attendance_statistics():
    """Get attendance statistics and summary"""
    try:
        if not ATTENDANCE_AVAILABLE:
            raise HTTPException(status_code=503, detail="Attendance service not available")
        
        stats = await get_attendance_stats()
        return AttendanceStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")

@router.get("/attendance/status")
async def get_attendance_status():
    """Get attendance service status"""
    return {
        "available": ATTENDANCE_AVAILABLE,
        "message": "Attendance service ready" if ATTENDANCE_AVAILABLE else "OpenCV required for attendance tracking"
    }

@router.get("/attendance/image/{filename}")
async def get_attendance_image(filename: str):
    """Get annotated attendance image"""
    image_path = os.path.join("static", "attendance", filename)
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        image_path,
        media_type="image/jpeg",
        filename=filename
    )