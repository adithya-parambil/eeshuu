'use client'
import { useRef, useEffect } from 'react'

/**
 * DepthGrid — ambient perspective grid canvas.
 *
 * Key changes vs original:
 * - Background is transparent (the page bg-colour shows through)
 * - Vignette uses warm indigo tones, not black
 * - Grid lines are blue-tinted rgba instead of white
 * - Radial highlight is a richer blue-violet dual glow
 * - Mouse parallax is preserved
 */
export function DepthGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseX = useRef(0)
  const mouseY = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width  = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width  = window.innerWidth
      height = window.innerHeight
      canvas.width  = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e: MouseEvent) => {
      mouseX.current = (e.clientX / width  - 0.5) * 2
      mouseY.current = (e.clientY / height - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    const LINES_Y = 22
    const NUM_V   = 18

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      /* ── Very faint warm-indigo vignette at edges only ─────────────────── */
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, height * 0.15,
        width / 2, height / 2, Math.max(width, height) * 0.75,
      )
      vignette.addColorStop(0, 'rgba(15,17,23,0)')    /* transparent centre */
      vignette.addColorStop(1, 'rgba(10,13,25,0.55)') /* warm-indigo edge fade */
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      /* ── Mouse parallax tilt ────────────────────────────────────────────── */
      const tiltX = mouseX.current * 8
      const tiltY = mouseY.current * 4
      ctx.save()
      ctx.translate(tiltX, tiltY)

      const vp = { x: width / 2, y: height * 0.30 }

      /* ── Horizontal perspective lines ───────────────────────────────────── */
      for (let i = 0; i < LINES_Y; i++) {
        const t      = i / LINES_Y
        const y      = vp.y + (height - vp.y) * Math.pow(t, 1.6)
        const spread = width * 1.6 * t
        /* Blue-tinted line colour, more visible in mid-range */
        const alpha  = 0.10 * t * (1 - t * 0.25)

        ctx.beginPath()
        ctx.moveTo(vp.x - spread, y)
        ctx.lineTo(vp.x + spread, y)
        ctx.strokeStyle = `rgba(100,148,255,${alpha})`
        ctx.lineWidth   = 0.6
        ctx.stroke()
      }

      /* ── Vertical converging lines ──────────────────────────────────────── */
      for (let i = 0; i <= NUM_V; i++) {
        const t      = i / NUM_V
        const xBot   = width * t
        const alpha  = 0.08 * Math.sin(t * Math.PI)

        ctx.beginPath()
        ctx.moveTo(vp.x, vp.y)
        ctx.lineTo(xBot, height)
        ctx.strokeStyle = `rgba(100,148,255,${alpha})`
        ctx.lineWidth   = 0.5
        ctx.stroke()
      }

      /* ── Dual radial highlight — blue top-centre, violet top-right ──────── */
      const blueGlow = ctx.createRadialGradient(width * 0.38, 0, 0, width * 0.38, 0, width * 0.55)
      blueGlow.addColorStop(0, 'rgba(79,142,247,0.09)')
      blueGlow.addColorStop(1, 'rgba(79,142,247,0)')
      ctx.fillStyle = blueGlow
      ctx.fillRect(0, 0, width, height)

      const violetGlow = ctx.createRadialGradient(width * 0.72, 0, 0, width * 0.72, 0, width * 0.45)
      violetGlow.addColorStop(0, 'rgba(124,106,247,0.07)')
      violetGlow.addColorStop(1, 'rgba(124,106,247,0)')
      ctx.fillStyle = violetGlow
      ctx.fillRect(0, 0, width, height)

      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.9 }}
    />
  )
}