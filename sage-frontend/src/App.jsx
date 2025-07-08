"use client"

import { useState } from "react"
import { HoverButton } from "./components/HoverButton"
import { BlackHoleBackground } from "./components/BlackHoleBackground"
import { SignUpForm } from "./components/SignUpForm"
import { LoginForm } from "./components/LoginForm"
import { TeacherDashboard } from "./components/TeacherDashboard"
import { StudentPortal } from "./components/StudentPortal"
import { RoleSelection } from "./components/RoleSelection"

function App() {
  const [currentPage, setCurrentPage] = useState("landing")
  const [userRole, setUserRole] = useState(null)
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false)
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState(null)

  const handleRoleSelect = (role) => {
    setUserRole(role)
    setShowRoleSelectionModal(false) 
    if (role === "teacher") {
      setCurrentPage("teacher-dashboard")
    } else {
      setCurrentPage("student-portal")
    }
  }

  const handleBackToLanding = () => {
    setCurrentPage("landing")
    setUserRole(null)
    setShowRoleSelectionModal(false)
    setSelectedRoleForAuth(null)
  }

  const handleAuthAction = (actionType) => {
    setCurrentPage(actionType)
    setShowRoleSelectionModal(false)
  }

  const openRoleSelectionModal = (role) => {
    setSelectedRoleForAuth(role)
    setShowRoleSelectionModal(true)
  }

  

  if (currentPage === "teacher-dashboard") {
    return <TeacherDashboard onLogout={handleBackToLanding} userRole={userRole} />
  }

  if (currentPage === "student-portal") {
    return <StudentPortal onLogout={handleBackToLanding} userRole={userRole} />
  }

  if (currentPage === "login") {
    return <LoginForm onLoginSuccess={() => { setUserRole(selectedRoleForAuth); setCurrentPage(selectedRoleForAuth === "teacher" ? "teacher-dashboard" : "student-portal"); setShowRoleSelectionModal(false); }} onBack={handleBackToLanding} />
  }

  if (currentPage === "signup") {
    return <SignUpForm onSignUpSuccess={() => { setUserRole(selectedRoleForAuth); setCurrentPage(selectedRoleForAuth === "teacher" ? "teacher-dashboard" : "student-portal"); setShowRoleSelectionModal(false); }} onBack={handleBackToLanding} />
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {showRoleSelectionModal && (
        <RoleSelection
          onRoleSelect={handleRoleSelect}
          onBack={() => setShowRoleSelectionModal(false)}
          onAuthAction={handleAuthAction}
          selectedRole={selectedRoleForAuth}
        />
      )}
      
      <BlackHoleBackground className="absolute inset-0 z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        
        <header className="w-full p-4 md:p-6"></header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600 font-poppins mb-2">SAGE</h1>
            <p className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-600 font-inter mb-1">
              Smart AI Guide for Education
            </p>
            <p className="text-lg md:text-xl font-normal text-white font-poppins mb-4">
              Learn Smarter with your classroom tutor
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <HoverButton
                text="Student"
                className="border-purple-400 text-white hover:text-purple-600"
                dotClassName="bg-purple-400"
                onClick={() => openRoleSelectionModal("student")}
              />
              <HoverButton
                text="Teacher"
                className="border-blue-400 text-white hover:text-blue-600"
                dotClassName="bg-blue-400"
                onClick={() => openRoleSelectionModal("teacher")}
              />
            </div>
          </div>
        </main>

        <footer className="w-full p-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} SAGE. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App



