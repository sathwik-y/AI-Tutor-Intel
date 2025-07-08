# app/services/attendance_service.py
import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
from datetime import datetime
import json

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=2)

class AttendanceTracker:
    def __init__(self):
        # Load OpenCV's pre-trained face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Alternative: DNN face detection (more accurate)
        try:
            # Load DNN model for better face detection
            model_path = cv2.dnn.DNN_BACKEND_OPENCV
            self.net = cv2.dnn.readNetFromTensorflow(
                cv2.samples.findFile("opencv_face_detector_uint8.pb"),
                cv2.samples.findFile("opencv_face_detector.pbtxt")
            )
            self.use_dnn = True
            print("Using DNN face detection (more accurate)")
        except:
            self.use_dnn = False
            print("Using Haar Cascade face detection")
        
        self.attendance_records = []
        
    def detect_faces_haar(self, image: np.ndarray) -> Tuple[int, List[Dict]]:
        """Detect faces using Haar Cascade (basic but reliable)"""
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            face_list = []
            for (x, y, w, h) in faces:
                face_list.append({
                    'bbox': [int(x), int(y), int(w), int(h)],
                    'confidence': 0.8  # Haar cascade doesn't provide confidence
                })
            
            return len(faces), face_list
            
        except Exception as e:
            print(f"Haar face detection error: {e}")
            return 0, []
    
    def detect_faces_dnn(self, image: np.ndarray) -> Tuple[int, List[Dict]]:
        """Detect faces using DNN (more accurate)"""
        try:
            h, w = image.shape[:2]
            
            # Create blob from image
            blob = cv2.dnn.blobFromImage(image, 1.0, (300, 300), [104, 117, 123])
            self.net.setInput(blob)
            detections = self.net.forward()
            
            faces = []
            for i in range(detections.shape[2]):
                confidence = detections[0, 0, i, 2]
                
                # Filter out weak detections
                if confidence > 0.5:
                    x1 = int(detections[0, 0, i, 3] * w)
                    y1 = int(detections[0, 0, i, 4] * h)
                    x2 = int(detections[0, 0, i, 5] * w)
                    y2 = int(detections[0, 0, i, 6] * h)
                    
                    faces.append({
                        'bbox': [x1, y1, x2-x1, y2-y1],
                        'confidence': float(confidence)
                    })
            
            return len(faces), faces
            
        except Exception as e:
            print(f"DNN face detection error: {e}")
            # Fallback to Haar cascade
            return self.detect_faces_haar(image)
    
    def detect_faces_in_frame(self, image: np.ndarray) -> Tuple[int, List[Dict]]:
        """Main face detection function"""
        if self.use_dnn:
            return self.detect_faces_dnn(image)
        else:
            return self.detect_faces_haar(image)
    
    def draw_detections(self, image: np.ndarray, faces: List[Dict]) -> np.ndarray:
        """Draw bounding boxes around detected faces"""
        annotated_image = image.copy()
        
        for i, face in enumerate(faces):
            x, y, w, h = face['bbox']
            confidence = face['confidence']
            
            # Draw bounding box
            color = (0, 255, 0)  # Green
            thickness = 2
            cv2.rectangle(annotated_image, (x, y), (x + w, y + h), color, thickness)
            
            # Draw confidence score
            label = f"Student {i+1}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            
            # Background for text
            cv2.rectangle(
                annotated_image, 
                (x, y - label_size[1] - 10), 
                (x + label_size[0], y), 
                color, 
                -1
            )
            
            # Text
            cv2.putText(
                annotated_image, 
                label, 
                (x, y - 5), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.5, 
                (255, 255, 255), 
                1
            )
        
        # Draw total count
        count_text = f"Total Students Detected: {len(faces)}"
        cv2.putText(
            annotated_image,
            count_text,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),  # Red
            2
        )
        
        # Add detection method info
        method_text = "Detection: DNN" if self.use_dnn else "Detection: Haar Cascade"
        cv2.putText(
            annotated_image,
            method_text,
            (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 0, 0),  # Blue
            1
        )
        
        return annotated_image
    
    def record_attendance(self, count: int, timestamp: Optional[str] = None) -> Dict:
        """Record attendance count with timestamp"""
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        
        record = {
            'timestamp': timestamp,
            'headcount': count,
            'session_id': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'detection_method': 'DNN' if self.use_dnn else 'Haar Cascade'
        }
        
        self.attendance_records.append(record)
        return record
    
    def get_attendance_summary(self, last_n: int = 10) -> Dict:
        """Get attendance summary for last N records"""
        recent_records = self.attendance_records[-last_n:] if self.attendance_records else []
        
        if not recent_records:
            return {
                'total_records': 0,
                'average_attendance': 0,
                'max_attendance': 0,
                'min_attendance': 0,
                'recent_records': []
            }
        
        counts = [record['headcount'] for record in recent_records]
        
        return {
            'total_records': len(recent_records),
            'average_attendance': sum(counts) / len(counts),
            'max_attendance': max(counts),
            'min_attendance': min(counts),
            'recent_records': recent_records
        }

# Global tracker instance
attendance_tracker = AttendanceTracker()

def _process_image_sync(image_data: bytes) -> Tuple[int, List[Dict], Optional[bytes]]:
    """Synchronous image processing"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return 0, [], None
        
        # Resize image if too large (for better performance)
        height, width = image.shape[:2]
        if width > 1024:
            scale = 1024 / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # Detect faces
        count, faces = attendance_tracker.detect_faces_in_frame(image)
        
        # Draw annotations
        annotated_image = attendance_tracker.draw_detections(image, faces)
        
        # Encode annotated image back to bytes
        _, buffer = cv2.imencode('.jpg', annotated_image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        annotated_bytes = buffer.tobytes()
        
        return count, faces, annotated_bytes
        
    except Exception as e:
        print(f"Image processing error: {e}")
        return 0, [], None

async def process_attendance_image(image_data: bytes) -> Dict:
    """Process uploaded image for attendance counting"""
    try:
        loop = asyncio.get_event_loop()
        count, faces, annotated_bytes = await loop.run_in_executor(
            executor,
            _process_image_sync,
            image_data
        )
        
        # Record attendance
        record = attendance_tracker.record_attendance(count)
        
        # Save annotated image
        annotated_path = None
        if annotated_bytes:
            filename = f"attendance_{record['session_id']}.jpg"
            annotated_path = os.path.join("static", "attendance", filename)
            os.makedirs(os.path.dirname(annotated_path), exist_ok=True)
            
            with open(annotated_path, 'wb') as f:
                f.write(annotated_bytes)
            
            annotated_path = f"/static/attendance/{filename}"
        
        return {
            'headcount': count,
            'faces_detected': faces,
            'timestamp': record['timestamp'],
            'session_id': record['session_id'],
            'detection_method': record['detection_method'],
            'annotated_image_url': annotated_path
        }
        
    except Exception as e:
        print(f"Attendance processing error: {e}")
        return {
            'headcount': 0,
            'faces_detected': [],
            'timestamp': datetime.now().isoformat(),
            'session_id': None,
            'detection_method': 'Error',
            'annotated_image_url': None,
            'error': str(e)
        }

async def get_attendance_stats() -> Dict:
    """Get attendance statistics"""
    return attendance_tracker.get_attendance_summary()

def export_attendance_data() -> str:
    """Export attendance data to JSON file"""
    try:
        filename = f"attendance_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join("static", "exports", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        data = {
            'export_timestamp': datetime.now().isoformat(),
            'total_records': len(attendance_tracker.attendance_records),
            'detection_method': 'DNN' if attendance_tracker.use_dnn else 'Haar Cascade',
            'records': attendance_tracker.attendance_records,
            'summary': attendance_tracker.get_attendance_summary()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return f"/static/exports/{filename}"
        
    except Exception as e:
        print(f"Export error: {e}")
        return None