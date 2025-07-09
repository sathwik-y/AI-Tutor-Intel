

"use client"

import { useState } from "react"
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input"
import { ArrowRight } from "lucide-react"

export function LoginForm({ onBack, onLoginSuccess }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const steps = [
    {
      field: "email",
      placeholders: [
        "Enter your email address",
        "your.email@example.com",
        "What's your email?",
        "Email for your account",
        "Your registered email...",
      ],
      title: "Welcome Back!",
      subtitle: "Enter your email to continue",
    },
    {
      field: "password",
      placeholders: [
        "Enter your password",
        "Your secure password",
        "Password here...",
        "Type your password",
        "Enter password to login",
      ],
      title: "Almost there!",
      subtitle: "Now enter your password",
    },
  ]

  const handleChange = (e) => {
    const currentField = steps[currentStep].field
    setFormData((prev) => ({
      ...prev,
      [currentField]: e.target.value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      console.log("Login data:", formData)
      
      alert(`Login successful!`)
      onLoginSuccess()
    }
  }

  const handleGoogleLogin = () => {
    console.log("Google login clicked")
    alert("Google login coming soon!")
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-white hover:text-gray-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors border border-white/20"
          >
            ← Back to Home
          </button>
        </div>


        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>


        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{currentStepData.title}</h1>
          <p className="text-xl md:text-2xl text-gray-200">{currentStepData.subtitle}</p>
        </div>


        <div className="mb-8">
          <PlaceholdersAndVanishInput
            placeholders={currentStepData.placeholders}
            onChange={handleChange}
            onSubmit={handleSubmit}
            type={currentStepData.field === "password" ? "password" : "text"}
            value={formData[currentStepData.field]}
          />
        </div>


        {currentStep === 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="border-t border-white/30 flex-1"></div>
              <span className="px-4 text-gray-200 text-sm">or</span>
              <div className="border-t border-white/30 flex-1"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full max-w-xl mx-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 group shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}


        <div className="flex justify-center space-x-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="text-gray-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
            >
              ← Back
            </button>
          )}

          <button onClick={onBack} className="text-gray-200 hover:text-white transition-colors">
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}
