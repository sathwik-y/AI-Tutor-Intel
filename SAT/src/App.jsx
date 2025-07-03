"use client"

import { useState } from "react"
import { HoverButton } from "./components/HoverButton"
import { BlackHoleBackground } from "./components/BlackHoleBackground"
import { TeacherDashboard } from "./components/TeacherDashboard"
import { StudentPortal } from "./components/StudentPortal"

function App() {
  const [currentPage, setCurrentPage] = useState("landing")
  const [userRole, setUserRole] = useState(null)

  const handleRoleSelect = (role) => {
    setUserRole(role)
    if (role === "teacher") {
      setCurrentPage("teacher-dashboard")
    } else {
      setCurrentPage("student-portal")
    }
  }

  const handleBackToLanding = () => {
    setCurrentPage("landing")
    setUserRole(null)
  }

  

  if (currentPage === "teacher-dashboard") {
    return <TeacherDashboard onLogout={handleBackToLanding} userRole={userRole} />
  }

  if (currentPage === "student-portal") {
    return <StudentPortal onLogout={handleBackToLanding} userRole={userRole} />
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      
      <BlackHoleBackground className="absolute inset-0 z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        
        <header className="w-full p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">SAGE</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Learn Smarter, Not Harder</h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12">
              Your personal AI tutor that adapts to your learning style
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <HoverButton
                text="Student"
                className="border-purple-400 text-white hover:text-purple-600"
                dotClassName="bg-purple-400"
                onClick={() => handleRoleSelect("student")}
              />
              <HoverButton
                text="Teacher"
                className="border-blue-400 text-white hover:text-blue-600"
                dotClassName="bg-blue-400"
                onClick={() => handleRoleSelect("teacher")}
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} SAGE. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App



