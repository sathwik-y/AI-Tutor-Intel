"use client"

import { useState, useRef, useEffect } from "react"
import { marked } from 'marked';
import { API_ENDPOINTS, getAudioUrl } from '../lib/api';
import { 
  BookOpen, 
  Camera, 
  Users, 
  BarChart3, 
  Settings, 
  Mic, 
  Upload, 
  Image as ImageIcon,
  Home,
  LogOut,
  Play,
  Square,
  Volume2,
  VolumeX,
  Send
} from "lucide-react"
import FileUpload from "./ui/FileUpload";
import AnimatedIconButton from "./ui/AnimatedIconButton";

export function TeacherDashboard({ onLogout, userRole = "teacher" }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRecording, setIsRecording] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [autoTTS, setAutoTTS] = useState(true)
  const [attendanceStats, setAttendanceStats] = useState({
    current: 0,
    average: 0,
    maximum: 0,
    records: 0
  })
  const [usageStats, setUsageStats] = useState({ voice: 0, text: 0, image: 0 })

  const formatExamContent = (rawText) => {
    if (!rawText) return { __html: '' };
    const processedText = rawText.replace(/^(### UNIT -)(\d+)/gm, '\n### UNIT $2');
    return { __html: marked.parse(processedText) };
  };

  const [transcript, setTranscript] = useState("Transcript will appear here...")
  const [llmResponse, setLlmResponse] = useState("Response will appear here...")
  const [audioStatus, setAudioStatus] = useState("Ready to listen...")
  
  const [textQuery, setTextQuery] = useState("")
  const [textResponse, setTextResponse] = useState("")
  const [conversationHistory, setConversationHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('chatHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);
  const [imageQuery, setImageQuery] = useState("What information can you extract from this image?")
  const [imageResponse, setImageResponse] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")
  const [indexedPdfs, setIndexedPdfs] = useState([])
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)

  const socketRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const currentAudioRef = useRef(null)

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "attendance", label: "Live Head Count", icon: Camera },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
    { id: "assistant", label: "Class Assistant", icon: Mic },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings }
  ]

  const speakText = async (text) => {
    if (!autoTTS || !text) return

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const response = await fetch(API_ENDPOINTS.TTS_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      })

      if (response.ok) {
        const data = await response.json()
        const audioUrl = getAudioUrl(data.audio_url)
        
        currentAudioRef.current = new Audio(audioUrl)
        
        currentAudioRef.current.oncanplay = () => {
          currentAudioRef.current.play().catch(error => {
            console.error('Audio play error:', error)
          })
        }
        
        currentAudioRef.current.onerror = (error) => {
          console.error('Audio error:', error)
        }
        
      } else {
        console.error('TTS failed:', response.status)
        const errorText = await response.text()
        console.error('TTS error details:', errorText)
      }
    } catch (error) {
      console.error('TTS error:', error)
    }
  }

  const startRecording = async () => {
    try {
      socketRef.current = new WebSocket(API_ENDPOINTS.WEBSOCKET_TRANSCRIBE)
      
      socketRef.current.onopen = () => {
        setAudioStatus("🎤 Connected - Recording in progress...")
      }

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'chunk_received':
            setAudioStatus(`Recording... (${data.chunk_count} chunks)`)
            break
          case 'processing':
            setAudioStatus(data.message)
            setTranscript("🔄 Processing your audio...")
            break
          case 'final_transcript':
            setTranscript(data.text)
            setAudioStatus("Transcript ready, thinking...")
            break
          case 'llm_response':
            setLlmResponse(data.text)
            setAudioStatus("✅ Complete! Ready for next question.")
            speakText(data.text)
            break
          case 'error':
            setAudioStatus(`❌ Error: ${data.message}`)
            break
        }
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true } 
      })
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { 
        mimeType: 'audio/webm;codecs=opus' 
      })
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then(buffer => socketRef.current.send(buffer))
        }
      }
      
      mediaRecorderRef.current.start(1000)
      setIsRecording(true)
      setTranscript("🎤 Listening... Speak your question now!")
      setLlmResponse("Waiting for your question...")
      
    } catch (error) {
      setAudioStatus(`❌ Error: ${error.message}`)
    }
  }

  const pollForAudioResponse = async () => {
    let attempts = 0;
    const maxAttempts = 30; 

    const intervalId = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setAudioStatus("❌ Error: Processing timed out.");
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.GET_LAST_RESPONSE);
        if (response.ok) {
          const data = await response.json();
          if (data.ready) {
            clearInterval(intervalId);
            setTranscript(data.transcript);
            setLlmResponse(data.response);
            setAudioStatus("✅ Complete! Ready for next question.");
            speakText(data.response);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
      attempts++;
    }, 1000); 
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close()
    }
    
    setAudioStatus("🔄 Processing your recording...")
    pollForAudioResponse();
  }

  const submitTextQuery = async () => {
    if (!textQuery.trim()) return

    try {
      const response = await fetch(API_ENDPOINTS.QUERY_TEXT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery, history: conversationHistory })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setTextResponse(`Error: ${errorText}`)
        return
      }
      
      const data = await response.json()
      setTextResponse(data.answer)
      speakText(data.answer)
      setConversationHistory(prev => [...prev, { role: 'user', content: textQuery }, { role: 'assistant', content: data.answer }]);
      loadUsageStats()
      
    } catch (error) {
      setTextResponse(`Error: ${error.message}`)
    }
  }

  const analyzeImage = async () => {
    const fileInput = document.getElementById('teacherImageFileAnalysis')
    
    if (!fileInput?.files[0]) {
      alert("Please select an image file first!")
      return
    }

    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('query', imageQuery)

    try {
      const response = await fetch(API_ENDPOINTS.QUERY_IMAGE, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        setImageResponse(`Error: ${errorText}`)
        return
      }
      
      const data = await response.json()
      setImageResponse(data.answer)
      speakText(data.answer)
      loadUsageStats()
      
    } catch (error) {
      setImageResponse(`Error: ${error.message}`)
    }
  }
  const uploadPDF = async () => {
    const fileInput = document.getElementById('teacherPdfFile')
    if (!fileInput?.files[0]) {
      alert("Please select a PDF file first!")
      return
    }

    const formData = new FormData()
    formData.append('file', fileInput.files[0])

    try {
      setUploadStatus('Uploading and processing PDF...')
      
      const response = await fetch(API_ENDPOINTS.UPLOAD_PDF, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setUploadStatus(`✅ ${data.status}`)
      loadIndexedPdfs()
      
    } catch (error) {
      setUploadStatus(`❌ Error: ${error.message}`)
    }
  }

  const loadIndexedPdfs = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.KNOWLEDGE_PDFS)
      const data = await response.json()
      setIndexedPdfs(data)
    } catch (error) {
      console.error('Error loading indexed PDFs:', error)
    }
  }

  const startCamera = async () => {
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current
        videoRef.current.play()
        setCameraActive(true)
        
        const detectInterval = setInterval(() => {
          if (!cameraStreamRef.current) {
            clearInterval(detectInterval)
            return
          }
          captureFrameForCount()
        }, 3000)
      }
      
    } catch (error) {
      console.error('Camera error:', error)
    }
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setCameraActive(false)
    setAttendanceStats(prev => ({ ...prev, current: 0 }))
  }

  const captureFrameForCount = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    try {
      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvasRef.current.toBlob(async (blob) => {
        const formData = new FormData()
        formData.append('file', blob, 'live_frame.jpg')
        
        try {
          const response = await fetch(API_ENDPOINTS.ATTENDANCE_UPLOAD, {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const data = await response.json()
            setAttendanceStats(prev => ({ ...prev, current: data.headcount }))
          }
        } catch (error) {
          console.log('Live count update failed:', error)
        }
      }, 'image/jpeg', 0.8)
      
    } catch (error) {
      console.error('Frame capture error:', error)
    }
  }

  const loadAttendanceStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ATTENDANCE_STATS)
      const data = await response.json()
      
      setAttendanceStats({
        current: attendanceStats.current,
        average: Math.round(data.average_attendance),
        maximum: data.max_attendance,
        records: data.total_records
      })
    } catch (error) {
      console.error('Stats error:', error)
    }
  }

  const loadUsageStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ANALYTICS_USAGE)
      const data = await response.json()
      setUsageStats({ voice: data.voice, text: data.text, image: data.image })
    } catch (error) {
      console.error('Usage stats error:', error)
    }
  }

  useEffect(() => {
    loadAttendanceStats()
    loadUsageStats()
    loadIndexedPdfs()
    
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  // State for interactive sparkle buttons
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-3xl glass-card">
                <div className="text-white">
                  <p className="text-sm opacity-80">Current Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.current}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-3xl glass-card">
                <div className="text-white">
                  <p className="text-sm opacity-80">Average Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.average}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-3xl glass-card">
                <div className="text-white">
                  <p className="text-sm opacity-80">Maximum Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.maximum}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-3xl glass-card">
                <div className="text-white">
                  <p className="text-sm opacity-80">Total Records</p>
                  <p className="text-3xl font-bold">{attendanceStats.records}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="sparkle-button text-white flex items-center gap-2"
                  style={{
                    '--active': hoveredBtn === 'attendance' ? 1 : 0,
                    background: hoveredBtn === 'attendance' ? undefined : '#22c55e', // vibrant green
                  }}
                  onMouseEnter={() => setHoveredBtn('attendance')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={() => setHoveredBtn('attendance')}
                  onBlur={() => setHoveredBtn(null)}
                >
                  <Camera className="w-5 h-5" />
                  Start Attendance
                </button>
                <button
                  onClick={() => setActiveTab("assistant")}
                  className="sparkle-button text-white flex items-center gap-2"
                  style={{
                    '--active': hoveredBtn === 'assistant' ? 1 : 0,
                    background: hoveredBtn === 'assistant' ? undefined : '#2563eb', // vibrant blue
                  }}
                  onMouseEnter={() => setHoveredBtn('assistant')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={() => setHoveredBtn('assistant')}
                  onBlur={() => setHoveredBtn(null)}
                >
                  <Mic className="w-5 h-5" />
                  AI Assistant
                </button>
                <button
                  onClick={() => setActiveTab("knowledge")}
                  className="sparkle-button text-white flex items-center gap-2"
                  style={{
                    '--active': hoveredBtn === 'knowledge' ? 1 : 0,
                    background: hoveredBtn === 'knowledge' ? undefined : '#ef4444', // vibrant red
                  }}
                  onMouseEnter={() => setHoveredBtn('knowledge')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onFocus={() => setHoveredBtn('knowledge')}
                  onBlur={() => setHoveredBtn(null)}
                >
                  <BookOpen className="w-5 h-5" />
                  Manage Knowledge
                </button>
              </div>
            </div>
          </div>
        )

      case "attendance":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Live Head Count Tracking</h2>
            
            {/* Camera Controls */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Live Camera</h3>
              <div className="flex gap-4 mb-6">
                <button
                  onClick={startCamera}
                  disabled={cameraActive}
                  className="camera-button"
                >
                  <div className="svg-wrapper-1">
                    <div className="svg-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="icon"
                      >
                        <path
                          d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM20 5H17L15.8 3H8.2L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5Z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <span>Start Camera</span>
                </button>
                <button
                  onClick={stopCamera}
                  disabled={!cameraActive}
                  className="stop-camera-button"
                >
                  <div className="svg-wrapper-1">
                    <div className="svg-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="icon"
                      >
                        <path
                          d="M6 6H18V18H6V6Z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <span>Stop Camera</span>
                </button>
              </div>
              
              <div className="flex gap-6">
                <div>
                  <video 
                    ref={videoRef}
                    width="320" 
                    height="240" 
                    className="border-2 border-gray-600 rounded-3xl"
                    style={{ display: cameraActive ? 'block' : 'none' }}
                  />
                  <canvas 
                    ref={canvasRef}
                    width="320" 
                    height="240" 
                    className="border-2 border-gray-600 rounded-3xl hidden"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-white">
                    <p className="text-sm text-gray-400">Camera Status:</p>
                    <p className={`font-semibold ${cameraActive ? 'text-green-400' : 'text-gray-400'}`}>
                      {cameraActive ? '📷 Camera Active' : 'Camera Stopped'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-blue-400">
                      Live Count: {attendanceStats.current}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Upload Image for Attendance</h3>
              <FileUpload
                id="teacherAttendanceImageFile"
                accept="image/*"
                onUpload={() => {/* TODO: implement attendance image upload handler */}}
                buttonText="📊 Count Students from the Image"
              />
            </div>
          </div>
        )

      case "assistant":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">AI Class Assistant</h2>
            
            {/* Audio Settings */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Audio Settings</h3>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-white">
                  <input 
                    type="checkbox" 
                    checked={autoTTS}
                    onChange={(e) => setAutoTTS(e.target.checked)}
                    className="rounded"
                  />
                  Automatic Speech Output
                </label>
                <button 
                  onClick={() => speakText("Hello! I'm SAGE, your smart classroom assistant.")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-2"
                >
                  {autoTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Test Speaker
                </button>
              </div>
            </div>

            {/* Voice Assistant */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Voice Assistant</h3>
              <div className="flex gap-4 mb-4">
                <AnimatedIconButton
                  icon={<Mic className="icon" width={24} height={24} />}
                  label={isRecording ? "Recording..." : "Start Listening"}
                  onClick={startRecording}
                  color="#22c55e"
                  disabled={isRecording}
                />
                <AnimatedIconButton
                  icon={<Square className="icon" width={24} height={24} />}
                  label="Stop & Process"
                  onClick={stopRecording}
                  color="#ef4444"
                  disabled={!isRecording}
                />
              </div>
              <div className="text-sm text-gray-400 mb-4">
                Status: {audioStatus}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">📝 Student Question:</h4>
                  <div className="bg-gray-700 p-4 rounded border min-h-[80px] text-gray-300">
                    {transcript}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2">🤖 SAGE Response:</h4>
                  <div className="bg-blue-900/30 p-4 rounded border min-h-[80px] text-gray-300">
                    {llmResponse}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Query */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Text Query</h3>
              <div className="flex gap-4">
                <textarea 
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Ask SAGE anything about the course material..."
                  rows="3"
                  className="flex-1 p-4 bg-gray-700 text-black rounded border border-gray-600 resize-none focus:border-purple-500 focus:outline-none input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitTextQuery()
                    }
                  }}
                />
                <button 
                  onClick={submitTextQuery}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-3xl transition-colors flex items-center gap-2 self-start"
                >
                  <Send className="w-4 h-4" />
                  Ask
                </button>
              </div>
              
              {textResponse && (
                <div className="mt-4 p-4 bg-purple-900/30 rounded border">
                  <h4 className="text-white font-semibold mb-2">🤖 Answer:</h4>
                  <div className="text-gray-300" dangerouslySetInnerHTML={formatExamContent(textResponse)} />
                </div>
              )}
            </div>

            {/* Image Analysis */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Image Analysis</h3>
              <FileUpload
                id="teacherImageFileAnalysis"
                accept="image/*"
                onUpload={analyzeImage}
                buttonText="Analyze"
                status={imageResponse}
              />
              <textarea
                value={imageQuery}
                onChange={(e) => setImageQuery(e.target.value)}
                placeholder="What would you like to know about this image?"
                rows="2"
                className="w-full p-3 bg-gray-700 text-black rounded border border-gray-600 resize-none focus:border-green-500 focus:outline-none mt-4"
              />
            </div>
          </div>
        )

      case "knowledge":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Knowledge Base Management</h2>
            
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Upload Documents</h3>
              <FileUpload
                id="teacherPdfFile"
                accept=".pdf"
                onUpload={uploadPDF}
                buttonText="📤 Upload PDF to Knowledge Base"
                status={uploadStatus || "Status: Ready to upload documents"}
              />
            </div>

            {/* Knowledge Base Stats */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Knowledge Base Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{indexedPdfs.length}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-white">{indexedPdfs.length > 0 ? new Date().toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Total Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.voice + usageStats.text + usageStats.image}</p>
                </div>
              </div>
              <button 
                onClick={loadIndexedPdfs}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl transition-colors"
              >
                Refresh Document List
              </button>
              {indexedPdfs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-white font-semibold mb-2">Indexed Documents:</h4>
                  <ul className="list-disc list-inside text-gray-300">
                    {indexedPdfs.map((pdfName, index) => (
                      <li key={index}>{pdfName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case "analytics":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Analytics & Reports</h2>
            
            {/* Attendance Analytics */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Attendance Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-600 p-4 rounded-3xl text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.current}</p>
                  <p className="text-blue-200 text-sm">Current</p>
                </div>
                <div className="bg-green-600 p-4 rounded-3xl text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.average}</p>
                  <p className="text-green-200 text-sm">Average</p>
                </div>
                <div className="bg-purple-600 p-4 rounded-3xl text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.maximum}</p>
                  <p className="text-purple-200 text-sm">Maximum</p>
                </div>
                <div className="bg-orange-600 p-4 rounded-3xl text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.records}</p>
                  <p className="text-orange-200 text-sm">Records</p>
                </div>
              </div>
              
              <button 
                onClick={loadAttendanceStats}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl transition-colors"
              >
                Refresh Statistics
              </button>
            </div>

            {/* Usage Analytics */}
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Usage Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Voice Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.voice}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Text Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.text}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-3xl">
                  <p className="text-gray-400 text-sm">Image Analysis</p>
                  <p className="text-2xl font-bold text-white">{usageStats.image}</p>
                </div>
              </div>
              <button 
                onClick={loadUsageStats}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl transition-colors"
              >
                Refresh Usage Statistics
              </button>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Settings</h2>
            
            <div className="bg-gray-800 p-6 rounded-3xl glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Auto-speak responses</span>
                  <div className="checkbox-wrapper">
                    <input
                      id="auto-tts-checkbox"
                      type="checkbox"
                      checked={autoTTS}
                      onChange={(e) => setAutoTTS(e.target.checked)}
                    />
                    <label htmlFor="auto-tts-checkbox">
                      <div className="tick_mark"></div>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Camera auto-start</span>
                  <div className="checkbox-wrapper">
                    <input
                      id="camera-auto-checkbox"
                      type="checkbox"
                    />
                    <label htmlFor="camera-auto-checkbox">
                      <div className="tick_mark"></div>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Attendance notifications</span>
                  <div className="checkbox-wrapper">
                    <input
                      id="attendance-notif-checkbox"
                      type="checkbox"
                    />
                    <label htmlFor="attendance-notif-checkbox">
                      <div className="tick_mark"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div className="text-white">Content not found</div>
    }
  }

  return (
    <div className="min-h-screen dashboard-bg flex">
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">SAGE Teacher</h1>
          <p className="text-gray-400 text-sm">Smart AI Learning Portal</p>
        </div>
        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors mt-8"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
