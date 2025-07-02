"use client"

import { useState, useRef, useEffect } from "react"
import { 
  BookOpen, 
  Mic, 
  Image as ImageIcon,
  Home,
  LogOut,
  Send,
  History,
  Upload,
  Search,
  Play,
  Square,
  Volume2,
  VolumeX
} from "lucide-react"

export function StudentPortal({ onLogout, userRole = "student" }) {
  const [activeTab, setActiveTab] = useState("assistant")
  const [isRecording, setIsRecording] = useState(false)
  const [autoTTS, setAutoTTS] = useState(true)
  const [textQuery, setTextQuery] = useState("")
  const [imageQuery, setImageQuery] = useState("What information can you extract from this image?")
  
  // Audio states
  const [transcript, setTranscript] = useState("Transcript will appear here...")
  const [llmResponse, setLlmResponse] = useState("Response will appear here...")
  const [audioStatus, setAudioStatus] = useState("Ready to listen...")
  const [textResponse, setTextResponse] = useState("")
  const [imageResponse, setImageResponse] = useState("")
  
  // Learning history
  const [learningHistory, setLearningHistory] = useState([])

  // WebSocket and MediaRecorder refs
  const socketRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  // Navigation items for students
  const navItems = [
    { id: "assistant", label: "AI Assistant", icon: Mic },
    { id: "knowledge", label: "Browse Knowledge", icon: BookOpen },
    { id: "history", label: "Learning History", icon: History },
    { id: "contribute", label: "Contribute", icon: Upload }
  ]

  // Auto-speak function
  const speakText = async (text) => {
    if (!autoTTS || !text) return

    try {
      const response = await fetch('http://localhost:8000/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (response.ok) {
        const data = await response.json()
        const audio = new Audio(data.audio_url)
        audio.play()
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
            
            // Add to learning history
            addToHistory('voice', data.text, transcript)
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
      setTranscript("🎤 Listening... Ask your question now!")
      setLlmResponse("Waiting for your question...")
      
    } catch (error) {
      setAudioStatus(`❌ Error: ${error.message}`)
    }
  }

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
  }

  // Text query function
  const submitTextQuery = async () => {
    if (!textQuery.trim()) return

    try {
      const response = await fetch('http://localhost:8000/api/query/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setTextResponse(`Error: ${errorText}`)
        return
      }
      const data = await response.json()
      setTextResponse(data.answer)
      speakText(data.answer)
      
      // Add to learning history
      addToHistory('text', data.answer, textQuery)
      
    } catch (error) {
      setTextResponse(`Error: ${error.message}`)
    }
  }

  // Image analysis function - FIXED to match client.html
  const analyzeImage = async () => {
    const fileInput = document.getElementById('imageFile')
    
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
      
      // Add to learning history
      addToHistory('image', data.answer, imageQuery)
      
    } catch (error) {
      setImageResponse(`Error: ${error.message}`)
    }
  }

  // Add to learning history
  const addToHistory = (type, response, query) => {
    const newEntry = {
      id: Date.now(),
      type,
      query,
      response,
      timestamp: new Date().toLocaleString()
    }
    
    setLearningHistory(prev => [newEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
  }

  // Upload contribution - FIXED to match client.html
  const uploadContribution = async () => {
    const fileInput = document.getElementById('contributionFile')
    if (!fileInput?.files[0]) {
      alert("Please select a PDF file first!")
      return
    }

    const formData = new FormData()
    formData.append('file', fileInput.files[0])

    try {
      const response = await fetch('http://localhost:8000/api/upload-pdf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      alert(`✅ ${data.status}`)
      
    } catch (error) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  // Render different tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case "assistant":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">Ask SAGE Anything! 🧠</h2>
              <p className="text-xl text-gray-300">Your personal AI tutor is here to help you learn</p>
            </div>

            {/* Audio Settings */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">🔊 Audio Settings</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white">
                    <input 
                      type="checkbox" 
                      checked={autoTTS}
                      onChange={(e) => setAutoTTS(e.target.checked)}
                      className="rounded"
                    />
                    Auto-speak responses
                  </label>
                  <button 
                    onClick={() => speakText("Hello! I'm SAGE, ready to help you learn.")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-2"
                  >
                    {autoTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Test
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Assistant */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-white mb-4">🎤 Voice Assistant</h3>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`px-8 py-4 rounded-lg transition-all duration-300 flex items-center gap-3 text-lg font-semibold ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                      : 'bg-white text-blue-600 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <Mic className="w-6 h-6" />
                  {isRecording ? 'Listening...' : 'Ask with Voice'}
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white px-6 py-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </div>
              
              <div className="text-white/80 mb-4 text-center">
                {audioStatus}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Your Question:
                  </h4>
                  <div className="text-white/90 min-h-[80px] p-2 bg-black/20 rounded">
                    {transcript}
                  </div>
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur">
                  <h4 className="text-white font-semibold mb-2">🤖 SAGE's Answer:</h4>
                  <div className="text-white/90 min-h-[80px] p-2 bg-black/20 rounded">
                    {llmResponse}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Query */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">💬 Type Your Question</h3>
              <div className="flex gap-4">
                <textarea 
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Type your question here... (e.g., 'Explain photosynthesis', 'What is calculus?')"
                  rows="3"
                  className="flex-1 p-4 bg-gray-700 text-white rounded border border-gray-600 resize-none focus:border-blue-500 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitTextQuery()
                    }
                  }}
                />
                <button 
                  onClick={submitTextQuery}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 self-start"
                >
                  <Send className="w-4 h-4" />
                  Ask
                </button>
              </div>
              
              {textResponse && (
                <div className="mt-4 p-4 bg-blue-900/30 rounded border">
                  <h4 className="text-white font-semibold mb-2">🤖 Answer:</h4>
                  <div className="text-gray-300">{textResponse}</div>
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
                    id="imageFile"
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
                    <div className="text-gray-300">{imageResponse}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "knowledge":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">📚 Knowledge Base</h2>
            
            {/* Search Knowledge Base */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">🔍 Search Knowledge Base</h3>
              <div className="flex gap-4">
                <input 
                  type="text"
                  placeholder="Search topics, subjects, or concepts..."
                  className="flex-1 p-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg transition-colors flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* Knowledge Categories */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📂 Browse by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Mathematics", count: "0 docs", color: "bg-blue-600" },
                  { name: "Science", count: "0 docs", color: "bg-green-600" },
                  { name: "History", count: "0 docs", color: "bg-purple-600" },
                  { name: "Literature", count: "0 docs", color: "bg-red-600" },
                  { name: "Computer Science", count: "0 docs", color: "bg-orange-600" },
                  { name: "Languages", count: "0 docs", color: "bg-pink-600" }
                ].map((category, index) => (
                  <div key={index} className={`${category.color} p-4 rounded-lg text-white cursor-pointer hover:opacity-80 transition-opacity`}>
                    <h4 className="font-semibold">{category.name}</h4>
                    <p className="text-sm opacity-80">{category.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📄 Recent Documents</h3>
              <div className="text-gray-400 text-center py-8">
                No documents available yet. Ask your teacher to upload course materials!
              </div>
            </div>
          </div>
        )

      case "history":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">📖 Learning History</h2>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600 p-6 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">{learningHistory.filter(h => h.type === 'voice').length}</p>
                <p className="text-blue-200">Voice Queries</p>
              </div>
              <div className="bg-green-600 p-6 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">{learningHistory.filter(h => h.type === 'text').length}</p>
                <p className="text-green-200">Text Queries</p>
              </div>
              <div className="bg-purple-600 p-6 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">{learningHistory.filter(h => h.type === 'image').length}</p>
                <p className="text-purple-200">Image Analysis</p>
              </div>
            </div>

            {/* History List */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Learning Sessions</h3>
              
              {learningHistory.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No learning history yet. Start asking questions to build your learning journey!
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {learningHistory.map((entry) => (
                    <div key={entry.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {entry.type === 'voice' && <Mic className="w-4 h-4 text-blue-400" />}
                        {entry.type === 'text' && <Send className="w-4 h-4 text-green-400" />}
                        {entry.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                        <span className="text-gray-400 text-sm">{entry.timestamp}</span>
                      </div>
                      <div className="text-white font-semibold mb-1">Q: {entry.query}</div>
                      <div className="text-gray-300 text-sm">A: {entry.response}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "contribute":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">🤝 Contribute to Learning</h2>
            
            {/* Upload Documents */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">📤 Share Knowledge</h3>
              <div className="border-2 border-dashed border-gray-600 p-8 rounded-lg text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input 
                  id="teacherPdfFile"
                  type="file" 
                  accept=".pdf"
                  className="mb-4 text-white"
                />
                <p className="text-gray-400 mb-4">
                  Have useful study materials? Share them with your classmates!
                </p>
                <button 
                  onClick={uploadContribution}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  📤 Upload PDF to Knowledge Base
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                <p>✅ Accepted formats: PDF</p>
                <p>📝 Note: All uploads are reviewed before being added to the knowledge base</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">💬 Feedback & Suggestions</h3>
              <textarea 
                placeholder="Share your feedback about SAGE or suggest improvements..."
                rows="4"
                className="w-full p-4 bg-gray-700 text-white rounded border border-gray-600 resize-none focus:border-blue-500 focus:outline-none"
              />
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
                📤 Send Feedback
              </button>
            </div>

            {/* Study Groups */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">👥 Study Groups</h3>
              <div className="text-gray-400 text-center py-8">
                Study group features coming soon! Connect with classmates and learn together.
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
          <h1 className="text-2xl font-bold text-white">SAGE Student</h1>
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
