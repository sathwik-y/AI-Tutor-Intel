"use client"

import { useState } from "react"
import { GraduationCap, Users } from "lucide-react"

export function RoleSelection({ onAuthAction, onBack, selectedRole }) {
  const roleTitle = selectedRole === "student" ? "Student" : "Teacher";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center relative max-w-sm w-full">
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-white mb-6">{roleTitle} Access</h2>
        <p className="text-gray-300 mb-8">Choose how you want to proceed as a {roleTitle.toLowerCase()}.</p>

        <div className="space-y-4">
          <button
            onClick={() => onAuthAction("login")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => onAuthAction("signup")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}