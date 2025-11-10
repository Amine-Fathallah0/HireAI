"use client"

import { useEffect, useRef } from "react"

interface DottedGlowBackgroundProps {
  className?: string
  opacity?: number
  gap?: number
  radius?: number
  colorLightVar?: string
  glowColorLightVar?: string
  colorDarkVar?: string
  glowColorDarkVar?: string
  backgroundOpacity?: number
  speedMin?: number
  speedMax?: number
  speedScale?: number
}

export function DottedGlowBackground({
  className = "",
  opacity = 1,
  gap = 10,
  radius = 1.6,
  colorLightVar = "--color-neutral-400",
  glowColorLightVar = "--color-neutral-500",
  colorDarkVar = "--color-neutral-600",
  glowColorDarkVar = "--color-neutral-700",
  backgroundOpacity = 0.5,
  speedMin = 0.3,
  speedMax = 1.6,
  speedScale = 1,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()

    const dots: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
    }> = []

    const dotsPerRow = Math.ceil(canvas.width / gap / window.devicePixelRatio)
    const dotsPerCol = Math.ceil(canvas.height / gap / window.devicePixelRatio)

    for (let i = 0; i < dotsPerRow; i++) {
      for (let j = 0; j < dotsPerCol; j++) {
        dots.push({
          x: i * gap + gap / 2,
          y: j * gap + gap / 2,
          vx: (Math.random() - 0.5) * speedScale * (speedMin + Math.random() * (speedMax - speedMin)),
          vy: (Math.random() - 0.5) * speedScale * (speedMin + Math.random() * (speedMax - speedMin)),
          radius: radius,
        })
      }
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)

      dots.forEach((dot) => {
        dot.x += dot.vx
        dot.y += dot.vy

        if (dot.x < 0 || dot.x > canvas.width / window.devicePixelRatio) dot.vx *= -1
        if (dot.y < 0 || dot.y > canvas.height / window.devicePixelRatio) dot.vy *= -1

        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => resizeCanvas()
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [gap, radius, speedMin, speedMax, speedScale, opacity])

  return <canvas ref={canvasRef} className={`absolute inset-0 ${className}`} />
}

