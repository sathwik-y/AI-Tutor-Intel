"use client"

import { ArrowRight } from "lucide-react"
import { cn } from "../lib/utils"

export function HoverButton({ text = "Button", className, dotClassName, onClick, ...props }) {
  const handleClick = (e) => {
    console.log(`Button "${text}" clicked!`)
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border-2 bg-transparent p-3 px-8 text-center font-semibold transition-all duration-300 hover:bg-white",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center gap-3 transition-all duration-300 group-hover:opacity-0">
        <div className={cn("size-2 rounded-lg transition-all duration-300", dotClassName)}></div>
        <span className="inline-block whitespace-nowrap">{text}</span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
        <span className="whitespace-nowrap">{text}</span>
        <ArrowRight className="size-4" />
      </div>
    </button>
  )
}
