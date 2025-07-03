"use client"

import { useState, useRef, useEffect } from "react"
import { marked } from 'marked';
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

  // Helper function to format exam content using marked
  const formatExamContent = (rawText) => {
    if (!rawText) return { __html: '' };
    // Pre-process specific headings like "### UNIT -1" to "### UNIT 1"
    const processedText = rawText.replace(/^(### UNIT -)(\d+)/gm, '### UNIT $2');
    return { __html: marked.parse(processedText) };
  };

  // Audio states
  const [transcript, setTranscript] = useState("Transcript will appear here...")
  const [llmResponse, setLlmResponse] = useState("Response will appear here...")
  const [audioStatus, setAudioStatus] = useState("Ready to listen...")
  
  // Text and Image states
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
  
  // Camera refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)

  // WebSocket and MediaRecorder refs
  const socketRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  // TTS Audio ref
  const currentAudioRef = useRef(null)

  // Navigation items
  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "attendance", label: "Live Attendance", icon: Camera },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
    { id: "assistant", label: "Class Assistant", icon: Mic },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings }
  ]

  // Auto-speak function
  const speakText = async (text) => {
    if (!autoTTS || !text) return

    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const response = await fetch('http://localhost:8000/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Construct the full URL for the audio file
        const audioUrl = data.audio_url.startsWith('http') 
          ? data.audio_url 
          : `http://localhost:8000${data.audio_url}`
        
        // Play the generated audio
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

  // Audio recording functions
  const startRecording = async () => {
    try {
      // Connect WebSocket
      socketRef.current = new WebSocket("ws://localhost:8000/ws/transcribe")
      
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

      // Get microphone access
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
    const maxAttempts = 30; // Poll for 30 seconds

    const intervalId = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setAudioStatus("❌ Error: Processing timed out.");
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/get-last-response');
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
    }, 1000); // Poll every second
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

  // Text query function
  const submitTextQuery = async () => {
    if (!textQuery.trim()) return

    try {
      const response = await fetch('http://localhost:8000/api/query/text', {
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

  // Image analysis function
  const analyzeImage = async () => {
    const fileInput = document.getElementById('teacherImageFile')
    
    if (!fileInput?.files[0]) {
      alert("Please select an image file first!")
      return
    }

    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('query', imageQuery)

    try {
      const response = await fetch('http://localhost:8000/api/query/image', {
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

  // PDF upload function
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
      
      const response = await fetch('http://localhost:8000/api/upload-pdf', {
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

  // Load indexed PDFs
  const loadIndexedPdfs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/knowledge/pdfs')
      const data = await response.json()
      setIndexedPdfs(data)
    } catch (error) {
      console.error('Error loading indexed PDFs:', error)
    }
  }

  // Camera functions
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
        
        // Start live detection
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
          const response = await fetch('http://localhost:8000/api/attendance/upload', {
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

  // Load attendance stats
  const loadAttendanceStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/attendance/stats')
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

  // Load usage stats
  const loadUsageStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics/usage')
      const data = await response.json()
      setUsageStats({ voice: data.voice, text: data.text, image: data.image })
    } catch (error) {
      console.error('Usage stats error:', error)
    }
  }

  // Load stats on component mount and cleanup
  useEffect(() => {
    loadAttendanceStats()
    loadUsageStats()
    loadIndexedPdfs()
    
    return () => {
      // Cleanup audio on unmount
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  // Render different tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg">
                <div className="text-white">
                  <p className="text-sm opacity-80">Current Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.current}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-lg">
                <div className="text-white">
                  <p className="text-sm opacity-80">Average Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.average}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-lg">
                <div className="text-white">
                  <p className="text-sm opacity-80">Maximum Attendance</p>
                  <p className="text-3xl font-bold">{attendanceStats.maximum}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-lg">
                <div className="text-white">
                  <p className="text-sm opacity-80">Total Records</p>
                  <p className="text-3xl font-bold">{attendanceStats.records}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab("attendance")}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Attendance
                </button>
                <button 
                  onClick={() => setActiveTab("assistant")}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  AI Assistant
                </button>
                <button 
                  onClick={() => setActiveTab("knowledge")}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center gap-2"
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
            <h2 className="text-3xl font-bold text-white mb-6">Live Attendance Tracking</h2>
            
            {/* Camera Controls */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📷 Live Camera</h3>
              <div className="flex gap-4 mb-6">
                <button
                  onClick={startCamera}
                  disabled={cameraActive}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </button>
                <button
                  onClick={stopCamera}
                  disabled={!cameraActive}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Camera
                </button>
              </div>
              
              <div className="flex gap-6">
                <div>
                  <video 
                    ref={videoRef}
                    width="320" 
                    height="240" 
                    className="border-2 border-gray-600 rounded-lg"
                    style={{ display: cameraActive ? 'block' : 'none' }}
                  />
                  <canvas 
                    ref={canvasRef}
                    width="320" 
                    height="240" 
                    className="border-2 border-gray-600 rounded-lg hidden"
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
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📤 Upload Image for Attendance</h3>
              <div className="border-2 border-dashed border-gray-600 p-6 rounded-lg text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="mb-4 text-white"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  📊 Count Students from Image
                </button>
              </div>
            </div>
          </div>
        )

      case "assistant":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">AI Class Assistant</h2>
            
            {/* Audio Settings */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">🔊 Audio Settings</h3>
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
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">🎤 Voice Assistant</h3>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                    isRecording 
                      ? 'bg-red-600 animate-pulse' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? 'Recording...' : 'Start Listening'}
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop & Process
                </button>
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
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">💬 Text Query</h3>
              <div className="flex gap-4">
                <textarea 
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Ask SAGE anything about the course material..."
                  rows="3"
                  className="flex-1 p-4 bg-gray-700 text-white rounded border border-gray-600 resize-none focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitTextQuery()
                    }
                  }}
                />
                <button 
                  onClick={submitTextQuery}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 self-start"
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
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📸 Image Analysis</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 p-6 rounded-lg text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input 
                    id="teacherImageFile"
                    type="file" 
                    accept="image/*" 
                    className="mb-4 text-white"
                  />
                  <p className="text-gray-400 mb-4">Upload an image and ask questions about it</p>
                </div>
                <textarea 
                  value={imageQuery}
                  onChange={(e) => setImageQuery(e.target.value)}
                  placeholder="What would you like to know about this image?"
                  rows="2"
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 resize-none focus:border-green-500 focus:outline-none"
                />
                <button 
                  onClick={analyzeImage}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Analyze Image
                </button>
                {imageResponse && (
                  <div className="p-4 bg-green-900/30 rounded border">
                    <h4 className="text-white font-semibold mb-2">🔍 Analysis:</h4>
                    <div className="text-gray-300" dangerouslySetInnerHTML={formatExamContent(imageResponse)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "knowledge":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Knowledge Base Management</h2>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📚 Upload Documents</h3>
              <div className="border-2 border-dashed border-gray-600 p-8 rounded-lg text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input 
                  id="teacherPdfFile"
                  type="file" 
                  accept=".pdf"
                  className="mb-4 text-white"
                />
                <p className="text-gray-400 mb-4">Upload PDF documents to add to the knowledge base</p>
                <button 
                  onClick={uploadPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  📤 Upload PDF to Knowledge Base
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                {uploadStatus || "Status: Ready to upload documents"}
              </div>
            </div>

            {/* Knowledge Base Stats */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Knowledge Base Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{indexedPdfs.length}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-white">{indexedPdfs.length > 0 ? new Date().toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Total Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.voice + usageStats.text + usageStats.image}</p>
                </div>
              </div>
              <button 
                onClick={loadIndexedPdfs}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh Document List
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
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📈 Attendance Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-600 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.current}</p>
                  <p className="text-blue-200 text-sm">Current</p>
                </div>
                <div className="bg-green-600 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.average}</p>
                  <p className="text-green-200 text-sm">Average</p>
                </div>
                <div className="bg-purple-600 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.maximum}</p>
                  <p className="text-purple-200 text-sm">Maximum</p>
                </div>
                <div className="bg-orange-600 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{attendanceStats.records}</p>
                  <p className="text-orange-200 text-sm">Records</p>
                </div>
              </div>
              
              <button 
                onClick={loadAttendanceStats}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📈 Refresh Statistics
              </button>
            </div>

            {/* Usage Analytics */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">💬 Usage Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Voice Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.voice}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Text Queries</p>
                  <p className="text-2xl font-bold text-white">{usageStats.text}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Image Analysis</p>
                  <p className="text-2xl font-bold text-white">{usageStats.image}</p>
                </div>
              </div>
              <button 
                onClick={loadUsageStats}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📈 Refresh Usage Statistics
              </button>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Settings</h2>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">⚙️ System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Auto-speak responses</span>
                  <input 
                    type="checkbox" 
                    checked={autoTTS}
                    onChange={(e) => setAutoTTS(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Camera auto-start</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Attendance notifications</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                  />
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
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}