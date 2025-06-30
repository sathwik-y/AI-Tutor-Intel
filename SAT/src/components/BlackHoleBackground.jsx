"use client"

import { useEffect, useRef } from "react"

export function BlackHoleBackground({ className = "" }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create stars
    const stars = []

    // Animation loop
    const animate = () => {
      const blackHoleX = canvas.width / 2
      const blackHoleY = canvas.height / 2
      const blackHoleRadius = Math.min(canvas.width, canvas.height) * 0.1

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create black hole
      const gradient = ctx.createRadialGradient(blackHoleX, blackHoleY, 0, blackHoleX, blackHoleY, blackHoleRadius * 3)
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)")
      gradient.addColorStop(0.3, "rgba(30, 0, 60, 0.8)")
      gradient.addColorStop(0.6, "rgba(60, 0, 120, 0.4)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.beginPath()
      ctx.arc(blackHoleX, blackHoleY, blackHoleRadius * 3, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Create and update stars
      stars.forEach((star, index) => {
        // Calculating distance to black hole
        const dx = blackHoleX - star.x
        const dy = blackHoleY - star.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Applying gravitational force
        const force = (blackHoleRadius * 20) / (distance * distance)
        const angle = Math.atan2(dy, dx)

        star.vx += Math.cos(angle) * force
        star.vy += Math.sin(angle) * force

        // Applying velocity with damping
        star.x += star.vx * 0.95
        star.y += star.vy * 0.95

        // If star is consumed by black hole, create a new one
        if (distance < blackHoleRadius) {
          stars[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.5,
            vx: 0,
            vy: 0,
            opacity: Math.random() * 0.8 + 0.2,
          }
        }

        // Draw star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    // Create initial stars
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 2 + 0.5
      stars.push({
        x,
        y,
        radius,
        vx: 0,
        vy: 0,
        opacity: Math.random() * 0.8 + 0.2,
      })
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
