// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // Text-to-Speech
  TTS_GENERATE: `${API_BASE_URL}/api/tts/generate`,
  
  // Audio/Voice
  WEBSOCKET_TRANSCRIBE: `${API_BASE_URL.replace('http', 'ws')}/ws/transcribe`,
  GET_LAST_RESPONSE: `${API_BASE_URL}/get-last-response`,
  
  // Query endpoints
  QUERY_TEXT: `${API_BASE_URL}/api/query/text`,
  QUERY_IMAGE: `${API_BASE_URL}/api/query/image`,
  
  // File upload
  UPLOAD_PDF: `${API_BASE_URL}/api/upload-pdf`,
  
  // Knowledge base
  KNOWLEDGE_PDFS: `${API_BASE_URL}/api/knowledge/pdfs`,
  
  // Attendance
  ATTENDANCE_UPLOAD: `${API_BASE_URL}/api/attendance/upload`,
  ATTENDANCE_STATS: `${API_BASE_URL}/api/attendance/stats`,
  
  // Analytics
  ANALYTICS_USAGE: `${API_BASE_URL}/api/analytics/usage`,
};

// Helper function to construct full audio URL
export const getAudioUrl = (audioPath) => {
  return audioPath.startsWith('http') ? audioPath : `${API_BASE_URL}${audioPath}`;
};

export default API_BASE_URL;