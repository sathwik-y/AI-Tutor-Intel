"use client"

import { useState } from "react"
import { GraduationCap, Users } from "lucide-react"

export function RoleSelection({ onRoleSelect, onBack }) {
  const [selectedRole, setSelectedRole] = useState(null)

  const roles = [
    {
      id: "student",
      title: "Student",
      icon: GraduationCap,
      description: "Learn with AI assistance",
      features: ["Voice & Text Queries", "Image Analysis", "Learning History", "Knowledge Base Access"],
      color: "from-blue-600 to-purple-600"
    },
    {
      id: "teacher",
      title: "Teacher",
      icon: Users,
      description: "Manage classes and knowledge",
      features: ["Live Attendance", "Knowledge Management", "AI Class Assistant", "Analytics Dashboard"],
      color: "from-green-600 to-teal-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back button */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-white hover:text-gray-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors border border-white/20"
          >
            ← Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Choose Your Role</h1>
          <p className="text-xl md:text-2xl text-gray-200">How would you like to use SAGE?</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedRole === role.id
                    ? 'border-white bg-white/10 backdrop-blur-lg shadow-2xl'
                    : 'border-white/30 bg-white/5 backdrop-blur-sm hover:border-white/50'
                }`}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-20 rounded-2xl`}></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full bg-gradient-to-br ${role.color}`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2">{role.title}</h3>
                    <p className="text-gray-200 text-lg">{role.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-200">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selection indicator */}
                  {selectedRole === role.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Continue Button */}
        {selectedRole && (
          <div className="text-center">
            <button
              onClick={() => onRoleSelect(selectedRole)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Continue as {roles.find(r => r.id === selectedRole)?.title}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
