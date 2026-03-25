'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/atoms/spinner'
import { cn } from '@/lib/utils'

// ─── Schemas ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
const registerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs number')
    .regex(/[^A-Za-z0-9]/, 'Needs special char'),
  role: z.enum(['customer', 'delivery']),
  phone: z.string().optional(),
})
type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

const DEMO = [
  { label: '👤 Customer', email: 'customer@demo.com', cls: 'customer' },
  { label: '🛵 Delivery', email: 'delivery@demo.com', cls: 'delivery' },
  { label: '⚙️ Admin',    email: 'admin@demo.com',    cls: 'admin'    },
]

const TESTIMONIALS = [
  { quote: '"Order placed, and literally before I could sit down, my doorbell rang. I genuinely thought it was a glitch. Nope — 7 minutes. Insane."', initials:'PK', name:'Priya K.', role:'Mumbai · Customer', bg:'rgba(200,255,0,.15)', color:'var(--acid)' },
  { quote: '"Switched from Zepto and Blinkit. Eeshuu\'s app is just smoother, faster, and my milk has actually been cold every single time."', initials:'RS', name:'Rahul S.', role:'Bengaluru · Customer', bg:'rgba(124,58,255,.2)', color:'#a78bfa' },
  { quote: '"As a delivery partner, the app is brilliant. Route optimization is insanely good. I complete more orders with less effort."', initials:'AM', name:'Amir M.', role:'Hyderabad · Delivery Partner', bg:'rgba(255,77,0,.15)', color:'var(--orange)' },
  { quote: '"3am craving hits different when you know Eeshuu\'s still awake. Got chips and ice cream in 9 minutes."', initials:'TJ', name:'Tanya J.', role:'Delhi · Customer', bg:'rgba(200,255,0,.1)', color:'var(--acid)' },
  { quote: '"The inventory is wild. Things I didn\'t know I needed, things I didn\'t know existed — all under 10 minutes away."', initials:'NK', name:'Neha K.', role:'Pune · Customer', bg:'rgba(255,200,100,.15)', color:'#f59e0b' },
]

function TestiCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = TESTIMONIALS.length

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActive(a => (a + 1) % total), 4000)
    return () => clearInterval(id)
  }, [paused, total])

  const prev = () => setActive(a => (a - 1 + total) % total)
  const next = () => setActive(a => (a + 1) % total)

  // Show 1 on mobile, 2 on tablet, 3 on desktop
  return (
    <div
      className="testi-carousel-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="testi-carousel-track">
        {TESTIMONIALS.map((t, i) => {
          const offset = (i - active + total) % total
          // visible slots: 0 = active, 1 = next, 2 = next+1
          const isVisible = offset < 3
          return (
            <div
              key={t.name}
              className={`testi-card testi-card-slot-${offset}${offset === 0 ? ' testi-active' : ''}`}
              style={{ display: isVisible ? 'flex' : 'none', flexDirection:'column' }}
            >
              <div style={{ display:'flex',gap:3,marginBottom:16 }}>
                {[0,1,2,3,4].map(s => <span key={s} style={{ color:'var(--acid)',fontSize:14 }}>⭐</span>)}
              </div>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-author">
                <div className="testi-avatar" style={{ background:t.bg,color:t.color }}>{t.initials}</div>
                <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Dots + arrows */}
      <div className="testi-controls">
        <button className="testi-arrow" onClick={prev} aria-label="Previous">‹</button>
        <div className="testi-dots">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`testi-dot${i === active ? ' testi-dot-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <button className="testi-arrow" onClick={next} aria-label="Next">›</button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const { login, register: registerUser, isLoading } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const gsapInitRef = useRef(false)
  const [showMobileFab, setShowMobileFab] = useState(false)

  // Show/hide mobile FAB based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth <= 768
      const authSection = document.getElementById('auth')
      if (!isMobile || !authSection) {
        setShowMobileFab(false)
        return
      }
      
      const authTop = authSection.getBoundingClientRect().top
      const windowHeight = window.innerHeight
      
      // Show FAB if auth section is not visible (below viewport)
      setShowMobileFab(authTop > windowHeight)
    }
    
    handleScroll() // Initial check
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // Re-run GSAP on every mount (handles client-side navigation back to this page)
  useEffect(() => {
    gsapInitRef.current = false
    const w = window as any
    
    // Reset all animated elements to visible state first
    const resetElements = () => {
      const elementsToReset = [
        '#hero-tag', '#hero-h1', '#hero-sub', '#hero-actions', '#scroll-hint',
        '.story-number', '.story-h2', '.story-body', '.story-stat', '.story-visual'
      ]
      elementsToReset.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.opacity = '1'
            el.style.transform = 'none'
          }
        })
      })
    }
    
    // If scripts already loaded (navigating back), reset and init immediately
    if (w.gsap && w.ScrollTrigger) {
      resetElements()
      // Small delay to ensure DOM is ready
      setTimeout(() => initGsap(), 50)
    }
    
    // Auto-scroll to auth section on mobile if hash is #auth or on page load
    const handleMobileAuthScroll = () => {
      const isMobile = window.innerWidth <= 768
      const hash = window.location.hash
      
      if (isMobile && (hash === '#auth' || hash === '')) {
        // Small delay to ensure page is rendered
        setTimeout(() => {
          const authSection = document.getElementById('auth')
          if (authSection) {
            authSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      }
    }
    
    handleMobileAuthScroll()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleMobileAuthScroll)
    
    // Cleanup ScrollTrigger instances on unmount to avoid stale triggers
    return () => {
      if (w.ScrollTrigger) w.ScrollTrigger.getAll().forEach((t: any) => t.kill())
      gsapInitRef.current = false
      window.removeEventListener('hashchange', handleMobileAuthScroll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Login form
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const [showLoginPass, setShowLoginPass] = useState(false)

  // Register form
  const regForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  })
  const [showRegPass, setShowRegPass] = useState(false)
  const regRole = regForm.watch('role')

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const redirect = (role: string) => {
    const routes: Record<string, string> = {
      customer: '/dashboard',
      delivery: '/delivery/orders',
      admin: '/admin/dashboard',
    }
    router.push(routes[role] ?? '/dashboard')
  }

  const onLogin = async (data: LoginData) => {
    try {
      await login(data.email, data.password)
      const user = useAuthStore.getState().user
      if (user) redirect(user.role)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid credentials')
    }
  }

  const onRegister = async (data: RegisterData) => {
    try {
      await registerUser(data)
      const user = useAuthStore.getState().user
      if (user) redirect(user.role)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed')
    }
  }

  const fillDemo = (email: string) => {
    loginForm.setValue('email', email)
    loginForm.setValue('password', 'Demo@1234')
    setTab('login')
  }

  const scrollToAuth = () => {
    const authSection = document.getElementById('auth')
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ── GSAP init (runs after CDN scripts load) ────────────────────────────────
  const initGsap = () => {
    if (gsapInitRef.current) return
    gsapInitRef.current = true
    const w = window as any
    const { gsap, ScrollTrigger, ScrollToPlugin } = w
    if (!gsap || !ScrollTrigger) return
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

    // Set initial hidden state before animating
    gsap.set('#hero-tag',     { opacity: 0, y: 20 })
    gsap.set('#hero-h1',      { opacity: 0, y: 40 })
    gsap.set('#hero-sub',     { opacity: 0, y: 30 })
    gsap.set('#hero-actions', { opacity: 0, y: 20 })
    gsap.set('#scroll-hint',  { opacity: 0 })
    gsap.set('.story-number', { opacity: 0, x: -30 })
    gsap.set('.story-h2',     { opacity: 0, y: 50 })
    gsap.set('.story-body',   { opacity: 0, y: 30 })
    gsap.set('.story-stat',   { opacity: 0, y: 30 })
    gsap.set('.story-visual', { opacity: 0, scale: 0.9 })

    // Hero entrance
    const heroTl = gsap.timeline({ delay: 0.3 })
    heroTl
      .to('#hero-tag',     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .to('#hero-h1',      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4')
      .to('#hero-sub',     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('#hero-actions', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      .to('#scroll-hint',  { opacity: 1, duration: 0.6 }, '-=0.2')

    // Hero parallax
    gsap.to('#hero-content', { y: 120, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 } })
    gsap.to('.hero-bg',      { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 } })
    gsap.to('.hero-grid-bg', { y: 60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.5 } })

    // Story reveals
    document.querySelectorAll('.story-number').forEach(el => gsap.to(el, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } }))
    document.querySelectorAll('.story-h2').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } }))
    document.querySelectorAll('.story-body').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } }))
    document.querySelectorAll('.story-stat').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }))
    document.querySelectorAll('.story-visual').forEach(el => gsap.to(el, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 75%', once: true } }))

    // Counters
    document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count!)
      const isDecimal = target % 1 !== 0
      ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => {
        gsap.to({ val: 0 }, { val: target, duration: 1.5, ease: 'power2.out', onUpdate: function(this: any) {
          el.textContent = isDecimal ? this.targets()[0].val.toFixed(1) : Math.round(this.targets()[0].val)
        }})
      }})
    })

    // HIW + cats
    gsap.from('.hiw-card', { y: 60, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.hiw-grid', start: 'top 75%', once: true } })
    gsap.from('.cat-card', { y: 40, opacity: 0, scale: 0.9, stagger: 0.07, duration: 0.6, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.cats-grid', start: 'top 80%', once: true } })

    // CTA + auth panel
    gsap.from('#cta-h2', { y: 80, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#cta-h2', start: 'top 80%', once: true } })
    gsap.from('#auth-panel', { x: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#auth', start: 'top 75%', once: true } })
    gsap.from('.auth-tagline', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#auth', start: 'top 75%', once: true } })

    // Hero 3D tilt
    const heroEl = document.getElementById('hero')
    const heroContent = document.getElementById('hero-content')
    if (heroEl && heroContent) {
      heroEl.addEventListener('mousemove', (e: any) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 12
        const y = (e.clientY / window.innerHeight - 0.5) * -8
        gsap.to(heroContent, { rotateX: y, rotateY: x, duration: 0.6, ease: 'power2.out', transformPerspective: 800 })
      })
      heroEl.addEventListener('mouseleave', () => {
        gsap.to(heroContent, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1,0.5)' })
      })
    }

    // Smooth scroll anchors
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href')!)
        if (target) { e.preventDefault(); gsap.to(window, { duration: 1, scrollTo: { y: target, offsetY: 0 }, ease: 'power3.inOut' }) }
      })
    })

    // Cursor
    const cursor = document.getElementById('lp-cursor')
    const trail = document.getElementById('lp-cursor-trail')
    if (cursor && trail) {
      let mx = 0, my = 0, tx = 0, ty = 0
      document.addEventListener('mousemove', (e: MouseEvent) => {
        mx = e.clientX; my = e.clientY
        cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'
      })
      const animTrail = () => {
        tx += (mx - tx) * 0.12; ty += (my - ty) * 0.12
        trail.style.left = tx + 'px'; trail.style.top = ty + 'px'
        requestAnimationFrame(animTrail)
      }
      animTrail()
      document.querySelectorAll('a, button, .cat-card, .hiw-card, .testi-card').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.style.width='24px'; cursor.style.height='24px'; cursor.style.background='#f7f4ef'; trail.style.width='60px'; trail.style.height='60px' })
        el.addEventListener('mouseleave', () => { cursor.style.width='12px'; cursor.style.height='12px'; cursor.style.background='#c8ff00'; trail.style.width='40px'; trail.style.height='40px' })
      })
    }
  }

  // Tab switch animation
  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    const w = window as any
    if (w.gsap) {
      const panel = document.getElementById(t === 'login' ? 'form-login' : 'form-register')
      if (panel) w.gsap.from(panel, { x: t === 'login' ? -20 : 20, opacity: 0, duration: 0.4, ease: 'power2.out' })
    }
  }

  return (
    <>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* GSAP CDN */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onLoad={initGsap} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" onLoad={initGsap} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js" strategy="afterInteractive" onLoad={initGsap} />

      <style>{`
        :root {
          --acid: #c8ff00;
          --orange: #ff4d00;
          --violet: #7c3aff;
          --mid: #111111;
          --border: rgba(247,244,239,0.1);
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'Space Mono', monospace;
        }
        html { scroll-behavior: auto; overflow-x: hidden; }
        body { cursor: none; overflow-x: hidden; }
        #lp-cursor { position:fixed;width:12px;height:12px;background:var(--acid);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .2s,height .2s,background .2s;mix-blend-mode:difference; }
        #lp-cursor-trail { position:fixed;width:40px;height:40px;border:1px solid rgba(200,255,0,0.4);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:all .12s ease-out; }
        .lp-nav-logo { font-family:var(--font-head);font-weight:800;font-size:22px;letter-spacing:-0.04em;color:#f7f4ef;display:flex;align-items:center;gap:8px; }
        .lp-nav-logo span { color:var(--acid); }
        .nav-dot { width:8px;height:8px;background:var(--acid);border-radius:50%;animation:pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.5} }
        .hero-bg { position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 80% 70% at 50% 60%,rgba(124,58,255,.15) 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 80% 20%,rgba(200,255,0,.08) 0%,transparent 60%),#050505; }
        .hero-grid-bg { position:absolute;inset:0;z-index:1;background-image:linear-gradient(rgba(247,244,239,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(247,244,239,.03) 1px,transparent 1px);background-size:80px 80px; }
        .hero-tag { display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--acid);border:1px solid rgba(200,255,0,.25);border-radius:100px;padding:8px 18px;margin-bottom:40px; }
        .hero-h1 { font-family:var(--font-head);font-weight:800;font-size:clamp(48px,12vw,130px);line-height:.92;letter-spacing:-.04em;color:#f7f4ef;margin-bottom:32px; }
        .hero-h1 em { font-style:normal;color:var(--acid); }
        .hero-sub { font-family:var(--font-body);font-size:clamp(16px,2.5vw,18px);font-weight:300;color:rgba(247,244,239,.55);max-width:480px;margin:0 auto 56px;line-height:1.7; }
        .hero-actions { display:flex;gap:16px;justify-content:center;align-items:center;flex-wrap:wrap; }
        .btn-primary { font-family:var(--font-head);font-weight:700;font-size:clamp(14px,2vw,15px);color:#050505;background:var(--acid);padding:clamp(14px,2vw,18px) clamp(32px,5vw,44px);border-radius:100px;text-decoration:none;letter-spacing:-.01em;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;display:inline-block; }
        .btn-primary:hover { transform:scale(1.04) translateY(-2px);box-shadow:0 20px 60px rgba(200,255,0,.25); }
        .btn-ghost { font-family:var(--font-body);font-size:clamp(13px,1.8vw,14px);font-weight:400;color:rgba(247,244,239,.6);text-decoration:none;display:flex;align-items:center;gap:8px;transition:color .2s; }
        .btn-ghost:hover { color:#f7f4ef; }
        .scroll-hint { position:absolute;bottom:40px;left:50%;transform:translateX(-50%);z-index:5;display:flex;flex-direction:column;align-items:center;gap:8px;font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:rgba(247,244,239,.3);text-transform:uppercase; }
        .scroll-line { width:1px;height:60px;background:linear-gradient(var(--acid),transparent);animation:scroll-line 2s infinite; }
        @keyframes scroll-line { 0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom} }
        .marquee-inner { display:inline-flex;gap:0;animation:marquee 20s linear infinite; }
        .marquee-item { font-family:var(--font-head);font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#050505;padding:0 32px; }
        .marquee-dot { color:rgba(0,0,0,.3); }
        @keyframes marquee { from{transform:translateX(0)}to{transform:translateX(-50%)} }
        .story-section { min-height:100vh;display:flex;align-items:center;padding:120px 80px; }
        .story-number { font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--acid);text-transform:uppercase;margin-bottom:24px;display:flex;align-items:center;gap:12px; }
        .story-number::after { content:'';display:block;width:40px;height:1px;background:var(--acid); }
        .story-h2 { font-family:var(--font-head);font-weight:800;font-size:clamp(48px,7vw,90px);line-height:.95;letter-spacing:-.04em;margin-bottom:28px; }
        .story-h2 .accent { color:var(--acid); }
        .story-h2 .orange { color:var(--orange); }
        .story-h2 .violet { color:var(--violet); }
        .story-body { font-size:18px;font-weight:300;line-height:1.8;color:rgba(247,244,239,.6);max-width:480px; }
        .story-stat { display:flex;gap:48px;margin-top:64px; }
        .stat-num { font-family:var(--font-head);font-weight:800;font-size:52px;line-height:1;letter-spacing:-.04em;color:#f7f4ef; }
        .stat-label { font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;color:rgba(247,244,239,.4);text-transform:uppercase; }
        .story-visual { flex:1;display:flex;align-items:center;justify-content:center; }
        .story-layout { display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:1400px;width:100%;margin:0 auto; }
        .story-layout.reverse { direction:rtl; }
        .story-layout.reverse > * { direction:ltr; }
        .delivery-visual-wrap { width:380px;height:380px;position:relative; }
        .delivery-card { position:absolute;background:var(--mid);border:1px solid rgba(247,244,239,.08);border-radius:20px;padding:20px 24px; }
        .delivery-card.main { inset:0;display:flex;flex-direction:column;justify-content:space-between; }
        .d-label { font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:rgba(247,244,239,.4);text-transform:uppercase; }
        .d-status { display:flex;align-items:center;gap:6px;font-size:12px;color:var(--acid);font-family:var(--font-mono); }
        .d-status-dot { width:6px;height:6px;background:var(--acid);border-radius:50%;animation:pulse-dot 1.5s infinite; }
        .d-item { display:flex;align-items:center;gap:12px; }
        .d-item-icon { width:36px;height:36px;background:rgba(247,244,239,.05);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px; }
        .d-item-name { font-size:14px;font-weight:500;color:#f7f4ef; }
        .d-item-qty { font-size:11px;color:rgba(247,244,239,.4);font-family:var(--font-mono); }
        .d-progress-label { display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;color:rgba(247,244,239,.4);margin-bottom:8px; }
        .d-progress-bar { height:4px;background:rgba(247,244,239,.1);border-radius:100px;overflow:hidden; }
        .d-progress-fill { height:100%;width:72%;background:var(--acid);border-radius:100px;animation:progress-anim 3s ease-in-out infinite alternate; }
        @keyframes progress-anim { from{width:65%}to{width:80%} }
        .d-eta { font-family:var(--font-head);font-weight:800;font-size:36px;letter-spacing:-.04em;color:var(--acid);margin-top:4px; }
        .d-eta small { font-size:13px;color:rgba(247,244,239,.4);font-weight:400;font-family:var(--font-mono); }
        .float-pill { position:absolute;right:-30px;top:30px;background:var(--acid);color:#050505;font-family:var(--font-head);font-weight:700;font-size:12px;padding:10px 18px;border-radius:100px;white-space:nowrap;animation:float-y 3s ease-in-out infinite; }
        @keyframes float-y { 0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)} }
        .hiw-section { padding:120px 80px;background:var(--mid); }
        .section-eyebrow { font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--acid);text-transform:uppercase;margin-bottom:16px; }
        .hiw-heading { font-family:var(--font-head);font-weight:800;font-size:clamp(40px,5vw,72px);letter-spacing:-.04em;line-height:1;margin-bottom:80px;max-width:700px; }
        .hiw-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(247,244,239,.06); }
        .hiw-card { background:var(--mid);padding:48px 36px;transition:background .3s; }
        .hiw-card:hover { background:rgba(247,244,239,.04); }
        .hiw-step { font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;color:rgba(247,244,239,.25);margin-bottom:32px;display:flex;align-items:center;gap:10px; }
        .hiw-step-bar { flex:1;height:1px;background:rgba(247,244,239,.1); }
        .hiw-icon { width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px; }
        .hiw-icon.acid { background:rgba(200,255,0,.1); }
        .hiw-icon.orange { background:rgba(255,77,0,.1); }
        .hiw-icon.violet { background:rgba(124,58,255,.1); }
        .hiw-icon.white { background:rgba(247,244,239,.08); }
        .hiw-title { font-family:var(--font-head);font-weight:700;font-size:22px;letter-spacing:-.02em;margin-bottom:12px; }
        .hiw-desc { font-size:14px;font-weight:300;line-height:1.7;color:rgba(247,244,239,.5); }
        .cats-section { padding:120px 80px; }
        .cats-heading { font-family:var(--font-head);font-weight:800;font-size:clamp(36px,4vw,60px);letter-spacing:-.04em;line-height:1;margin-bottom:64px;display:flex;align-items:center;gap:24px;flex-wrap:wrap; }
        .cats-grid { display:grid;grid-template-columns:repeat(6,1fr);gap:12px; }
        .cat-card { background:var(--mid);border-radius:20px;padding:32px 20px;text-align:center;border:1px solid rgba(247,244,239,.06);cursor:pointer;transition:all .3s;position:relative;overflow:hidden; }
        .cat-card::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--hover-color,rgba(200,255,0,.1)) 0%,transparent 60%);opacity:0;transition:opacity .3s; }
        .cat-card:hover { transform:translateY(-6px);border-color:rgba(247,244,239,.15); }
        .cat-card:hover::before { opacity:1; }
        .cat-emoji { font-size:36px;display:block;margin-bottom:12px; }
        .cat-name { font-family:var(--font-head);font-weight:700;font-size:14px;letter-spacing:-.01em; }
        .cat-time { font-family:var(--font-mono);font-size:10px;color:var(--acid);letter-spacing:.08em;margin-top:6px; }
        .testi-section { padding:120px 0;background:var(--mid);overflow:hidden; }
        .testi-heading { font-family:var(--font-head);font-weight:800;font-size:clamp(36px,4vw,60px);letter-spacing:-.04em;text-align:center;margin-bottom:64px;padding:0 80px; }
        .testi-carousel-wrap { padding:0 80px 48px;max-width:1400px;margin:0 auto; }
        .testi-carousel-track { display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:40px; }
        .testi-card { background:#050505;border:1px solid rgba(247,244,239,.08);border-radius:24px;padding:36px;transition:border-color .3s; }
        .testi-card.testi-active { border-color:rgba(200,255,0,.3); }
        .testi-quote { font-size:15px;line-height:1.8;font-weight:300;color:rgba(247,244,239,.8);margin-bottom:28px;flex:1; }
        .testi-author { display:flex;align-items:center;gap:12px; }
        .testi-avatar { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;font-family:var(--font-head);flex-shrink:0; }
        .testi-name { font-weight:600;font-size:14px;font-family:var(--font-head); }
        .testi-role { font-size:12px;color:rgba(247,244,239,.4);font-family:var(--font-mono); }
        .testi-controls { display:flex;align-items:center;justify-content:center;gap:20px; }
        .testi-dots { display:flex;gap:8px;align-items:center; }
        .testi-dot { width:8px;height:8px;border-radius:50%;background:rgba(247,244,239,.2);border:none;cursor:pointer;padding:0;transition:all .3s; }
        .testi-dot.testi-dot-active { background:var(--acid);width:24px;border-radius:4px; }
        .testi-arrow { background:rgba(247,244,239,.06);border:1px solid rgba(247,244,239,.1);color:rgba(247,244,239,.6);width:40px;height:40px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;line-height:1; }
        .testi-arrow:hover { background:rgba(200,255,0,.1);border-color:rgba(200,255,0,.3);color:var(--acid); }
        .cta-section { padding:160px 80px;text-align:center;position:relative;overflow:hidden; }
        .cta-bg-orb { position:absolute;width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,255,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none; }
        .cta-h2 { font-family:var(--font-head);font-weight:800;font-size:clamp(52px,9vw,120px);letter-spacing:-.04em;line-height:.92;margin-bottom:48px;position:relative;z-index:1; }
        .cta-h2 .line2 { color:var(--acid); }
        .cta-sub { font-size:18px;font-weight:300;color:rgba(247,244,239,.5);margin-bottom:56px;position:relative;z-index:1; }
        #auth { min-height:100vh;display:flex;background:#050505;position:relative; }
        .auth-left { flex:1;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:var(--mid);position:relative;overflow:hidden; }
        .auth-left-bg { position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 30% 70%,rgba(200,255,0,.06) 0%,transparent 60%); }
        .auth-left-content { position:relative;z-index:1; }
        .auth-brand { font-family:var(--font-head);font-weight:800;font-size:18px;letter-spacing:-.03em;display:flex;align-items:center;gap:8px;margin-bottom:80px; }
        .auth-tagline { font-family:var(--font-head);font-weight:800;font-size:clamp(36px,4vw,60px);letter-spacing:-.04em;line-height:1.05;margin-bottom:24px; }
        .auth-tagline em { font-style:normal;color:var(--acid); }
        .auth-sub { font-size:16px;font-weight:300;color:rgba(247,244,239,.5);line-height:1.7; }
        .auth-stats { display:flex;gap:40px;margin-top:64px; }
        .auth-stat-num { font-family:var(--font-head);font-weight:800;font-size:36px;letter-spacing:-.04em;color:#f7f4ef; }
        .auth-stat-label { font-size:12px;color:rgba(247,244,239,.4);font-family:var(--font-mono);letter-spacing:.06em; }
        .auth-right { width:520px;padding:80px 64px;display:flex;flex-direction:column;justify-content:center;border-left:1px solid rgba(247,244,239,.06); }
        .auth-tabs { display:flex;margin-bottom:48px;border-bottom:1px solid rgba(247,244,239,.08); }
        .auth-tab { font-family:var(--font-head);font-weight:700;font-size:14px;letter-spacing:-.01em;padding:0 0 16px;margin-right:32px;color:rgba(247,244,239,.3);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .3s; }
        .auth-tab.active { color:#f7f4ef;border-bottom-color:var(--acid); }
        .form-group { margin-bottom:20px;position:relative; }
        .form-label { display:block;font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:rgba(247,244,239,.4);text-transform:uppercase;margin-bottom:8px; }
        .form-input { width:100%;background:rgba(247,244,239,.04);border:1px solid rgba(247,244,239,.1);border-radius:12px;color:#f7f4ef;font-family:var(--font-body);font-size:15px;font-weight:300;padding:14px 18px;outline:none;transition:border-color .3s,background .3s; }
        .form-input:focus { border-color:var(--acid);background:rgba(200,255,0,.04); }
        .form-input::placeholder { color:rgba(247,244,239,.2); }
        .form-input.error { border-color:rgba(255,77,0,.5); }
        .form-error { font-family:var(--font-mono);font-size:10px;color:#ff6b3d;margin-top:4px;letter-spacing:.04em; }
        .form-input-wrap { position:relative; }
        .form-input-wrap .form-input { padding-right:48px; }
        .form-input-wrap button { position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(247,244,239,.3);transition:color .2s; }
        .form-input-wrap button:hover { color:rgba(247,244,239,.7); }
        .form-submit { width:100%;padding:16px;border-radius:12px;background:var(--acid);color:#050505;font-family:var(--font-head);font-weight:700;font-size:16px;letter-spacing:-.01em;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px; }
        .form-submit:hover { transform:translateY(-2px);box-shadow:0 12px 40px rgba(200,255,0,.25); }
        .form-submit:disabled { opacity:.6;cursor:not-allowed;transform:none; }
        .role-selector { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px; }
        .role-btn { padding:12px;border-radius:10px;border:1px solid rgba(247,244,239,.1);background:transparent;color:rgba(247,244,239,.5);font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;text-align:center; }
        .role-btn.active { border-color:var(--acid);color:#f7f4ef;background:rgba(200,255,0,.08); }
        .demo-strip { margin-top:28px;padding:16px;background:rgba(247,244,239,.03);border-radius:12px;border:1px solid rgba(247,244,239,.06); }
        .demo-label { font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:rgba(247,244,239,.3);text-transform:uppercase;margin-bottom:12px; }
        .demo-pills { display:flex;gap:8px;flex-wrap:wrap; }
        .demo-pill { padding:6px 14px;border-radius:100px;border:1px solid rgba(247,244,239,.1);background:transparent;font-family:var(--font-mono);font-size:10px;letter-spacing:.06em;cursor:pointer;transition:all .2s;color:rgba(247,244,239,.5); }
        .demo-pill.customer:hover { color:#60a5fa;border-color:#60a5fa; }
        .demo-pill.delivery:hover { color:#a78bfa;border-color:#a78bfa; }
        .demo-pill.admin:hover { color:var(--orange);border-color:var(--orange); }
        .mobile-auth-fab { position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;background:var(--acid);color:#050505;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(200,255,0,.4);display:none;align-items:center;justify-content:center;font-size:24px;transition:transform .2s,box-shadow .2s; }
        .mobile-auth-fab:active { transform:scale(0.95); }
        .mobile-auth-fab.show { display:flex; }
        footer { padding:60px 80px;border-top:1px solid rgba(247,244,239,.06);display:flex;align-items:center;justify-content:space-between; }
        .footer-brand { font-family:var(--font-head);font-weight:800;font-size:20px;letter-spacing:-.04em; }
        .footer-brand span { color:var(--acid); }
        .footer-copy { font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;color:rgba(247,244,239,.3); }
        @media(min-width:1400px){
          .hero-h1{font-size:130px}
          .hero-sub{font-size:19px}
        }
        @media(min-width:1200px) and (max-width:1399px){
          .hero-h1{font-size:110px}
          .hero-sub{font-size:18px}
        }
        @media(min-width:901px) and (max-width:1199px){
          .hero-h1{font-size:90px}
          .hero-sub{font-size:17px;max-width:420px}
          .hero-tag{font-size:10px;padding:7px 16px}
        }
        @media(max-width:900px){
          .story-section{padding:80px 24px}
          .story-layout{grid-template-columns:1fr}
          .story-visual{margin-top:60px}
          .story-layout.reverse{direction:ltr}
          .hiw-section{padding:80px 24px}
          .hiw-grid{grid-template-columns:1fr 1fr}
          .cats-section{padding:80px 24px}
          .cats-grid{grid-template-columns:repeat(3,1fr)}
          .testi-section{padding:80px 0}
          .testi-carousel-wrap{padding:0 24px 40px}
          .testi-carousel-track{grid-template-columns:repeat(2,1fr)}
          .testi-card-slot-2{display:none!important}
          .testi-heading{padding:0 24px}
          .cta-section{padding:100px 24px}
          #auth{flex-direction:column}
          .auth-left{padding:60px 24px}
          .auth-right{width:100%;padding:60px 24px}
          footer{padding:40px 24px;flex-direction:column;gap:16px;text-align:center}
          .story-stat{flex-wrap:wrap;gap:32px}
          .hero-h1{font-size:clamp(42px,10vw,80px);margin-bottom:24px}
          .hero-sub{font-size:16px;margin-bottom:40px;padding:0 16px}
          .hero-tag{font-size:10px;padding:6px 14px;margin-bottom:32px}
          .hero-actions{gap:12px;padding:0 16px}
          .scroll-hint{bottom:24px}
        }
        @media(max-width:768px){
          .auth-left{display:none}
          .hero-h1{font-size:clamp(36px,9vw,64px);line-height:1;margin-bottom:20px}
          .hero-sub{font-size:15px;max-width:360px;margin-bottom:32px}
          .hero-tag{font-size:9px;padding:5px 12px;gap:6px;margin-bottom:24px}
          .btn-primary{padding:14px 32px;font-size:14px}
          .btn-ghost{font-size:13px}
          #hero{height:auto;min-height:100vh;padding:80px 0 60px}
          .mobile-auth-fab.show{display:flex}
        }
        @media(max-width:600px){
          .hiw-grid{grid-template-columns:1fr}
          .cats-grid{grid-template-columns:repeat(2,1fr)}
          .testi-carousel-track{grid-template-columns:1fr}
          .testi-card-slot-1,.testi-card-slot-2{display:none!important}
          .hero-h1{font-size:clamp(32px,11vw,48px);margin-bottom:16px}
          .hero-sub{font-size:14px;line-height:1.6;max-width:320px;margin-bottom:28px;padding:0 8px}
          .hero-tag{font-size:8px;padding:4px 10px;letter-spacing:.08em}
          .hero-actions{flex-direction:column;width:100%;padding:0 24px}
          .btn-primary{width:100%;max-width:280px;padding:16px 24px;font-size:15px}
          .btn-ghost{font-size:12px;justify-content:center}
          .scroll-hint{display:none}
          #hero{padding:60px 0 40px}
        }
        @media(max-width:480px){
          .hero-h1{font-size:clamp(28px,12vw,40px);letter-spacing:-.02em}
          .hero-sub{font-size:13px;max-width:280px}
          .hero-tag{font-size:7px;padding:3px 8px}
          .btn-primary{font-size:14px;padding:14px 20px}
          .btn-ghost{font-size:11px}
        }
      `}</style>

      {/* Custom cursor */}
      <div id="lp-cursor" />
      <div id="lp-cursor-trail" />

      {/* NAV */}
      

      {/* HERO */}
      <section id="hero" style={{ minHeight:'100vh',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',padding:'80px 20px' }}>
        <div className="hero-bg" />
        <div className="hero-grid-bg" />
        <div style={{ position:'absolute',fontFamily:'var(--font-head)',fontWeight:800,fontSize:'clamp(200px,30vw,350px)',top:'-60px',right:'-40px',opacity:.02,lineHeight:1,userSelect:'none',pointerEvents:'none',color:'#f7f4ef' }}>E</div>
        <div id="hero-content" style={{ position:'relative',zIndex:5,textAlign:'center',maxWidth:'min(1000px, 90vw)',padding:'0 16px',width:'100%' }}>
          <div className="hero-tag" id="hero-tag">
            <span style={{ display:'inline-block',width:6,height:6,background:'var(--acid)',borderRadius:'50%' }} />
            Now live in 147 cities
          </div>
          <h1 className="hero-h1" id="hero-h1"><em>Eeshuu</em><br />Blink &amp;<br /><em>It&apos;s There.</em></h1>
          <p className="hero-sub" id="hero-sub">Groceries, essentials, everything you need — delivered in under 10 minutes. No compromises. No waits.</p>
          <div className="hero-actions" id="hero-actions">
            <a href="#auth" className="btn-primary">Order Now</a>
            <a href="#story" className="btn-ghost">
              See how it works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
        <div className="scroll-hint" id="scroll-hint"><div className="scroll-line" />scroll</div>
      </section>

      {/* MARQUEE */}
      <div style={{ padding:'24px 0',background:'var(--acid)',overflow:'hidden',whiteSpace:'nowrap' }}>
        <div className="marquee-inner">
          {['10 minute delivery','147 cities','2.1M orders monthly','98.4% on-time rate','Grocery & essentials','Real-time tracking','10 minute delivery','147 cities','2.1M orders monthly','98.4% on-time rate','Grocery & essentials','Real-time tracking'].map((t,i) => (
            <span key={i} className="marquee-item">{t} <span className="marquee-dot">●</span></span>
          ))}
        </div>
      </div>

      {/* STORY 1 — Speed (text only, no speed-orb) */}
      <section id="story" className="story-section" style={{ background:'#050505' }}>
        <div className="story-layout">
          <div style={{ padding:'40px 0' }}>
            <div className="story-number">01 — Speed</div>
            <h2 className="story-h2">We don&apos;t<br />do <span className="accent">slow.</span></h2>
            <p className="story-body">Traditional delivery says 30–60 minutes. We said no. Our dark store network and AI-powered routing means your order is out the door before you&apos;ve unlocked your phone.</p>
            <div className="story-stat">
              <div><span className="stat-num" data-count="10">10</span><div className="stat-label">Mins avg. delivery</div></div>
              <div><span className="stat-num" data-count="98">98</span><div className="stat-label">% On-time rate</div></div>
            </div>
          </div>
          <div className="story-visual">
            <div style={{ display:'flex',flexDirection:'column',gap:24,maxWidth:400 }}>
              {[['⚡','Speed','AI-optimized routing picks the nearest dark store stocked with your items.'],['🛵','Dispatch','Rider assigned in under 60 seconds. No idle time, no delays.'],['📦','Delivery','Sealed, fresh, and at your door before you can change your mind.']].map(([icon,title,desc]) => (
                <div key={title as string} style={{ display:'flex',gap:16,padding:'20px 24px',background:'var(--mid)',borderRadius:16,border:'1px solid rgba(247,244,239,.06)' }}>
                  <div style={{ fontSize:28,flexShrink:0 }}>{icon}</div>
                  <div><div style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:16,marginBottom:4 }}>{title as string}</div><div style={{ fontSize:13,fontWeight:300,color:'rgba(247,244,239,.5)',lineHeight:1.6 }}>{desc as string}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY 2 — Scale (text only, no map-visual) */}
      <section className="story-section" style={{ background:'var(--mid)' }}>
        <div className="story-layout reverse">
          <div style={{ padding:'40px 0' }}>
            <div className="story-number">02 — Scale</div>
            <h2 className="story-h2">Every corner<br />of <span className="orange">India.</span></h2>
            <p className="story-body">From Mumbai&apos;s lanes to Chandigarh&apos;s sectors, our dark store network spans 147 cities. We&apos;re not stopping until we&apos;re in your neighborhood, whatever neighborhood that is.</p>
            <div className="story-stat">
              <div><span className="stat-num" data-count="147">147+</span><div className="stat-label">Cities active</div></div>
              <div><span className="stat-num" data-count="800">80+</span><div className="stat-label">Dark stores</div></div>
            </div>
          </div>
          <div className="story-visual">
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:380 }}>
              {[['Mumbai','🌊'],['Delhi','🏛️'],['Bengaluru','🌿'],['Hyderabad','💎'],['Chennai','🌴'],['Pune','🎓'],['Kolkata','🎨'],['Chandigarh','🌸']].map(([city,emoji]) => (
                <div key={city as string} style={{ padding:'16px 20px',background:'#050505',borderRadius:14,border:'1px solid rgba(247,244,239,.06)',display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:20 }}>{emoji}</span>
                  <div>
                    <div style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:13 }}>{city as string}</div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--acid)',letterSpacing:'0.08em',marginTop:2 }}>LIVE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY 3 — Tracking (keep delivery card visual) */}
      <section className="story-section" style={{ background:'#050505' }}>
        <div className="story-layout">
          <div style={{ padding:'40px 0' }}>
            <div className="story-number">03 — Transparency</div>
            <h2 className="story-h2">Watch it<br /><span className="violet">happen.</span></h2>
            <p className="story-body">No more &quot;out for delivery&quot; black holes. Track your rider second-by-second on a live map. Know exactly when to open your door.</p>
            <div className="story-stat">
              <div><span className="stat-num" data-count="2.1">21</span><div className="stat-label">M orders tracked live</div></div>
              <div><span className="stat-num" data-count="4.9">4.9</span><div className="stat-label">App store rating</div></div>
            </div>
          </div>
          <div className="story-visual">
            <div className="delivery-visual-wrap">
              <div className="delivery-card main">
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div><div className="d-label">Order #EE-2491</div><div style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:16,marginTop:4 }}>Your order</div></div>
                  <div className="d-status"><div className="d-status-dot" />On the way</div>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {[['🥛','Amul Milk 500ml','×2 units'],['🍌','Bananas (6 pcs)','×1 bunch'],['🧴','Dove Body Wash','×1 unit']].map(([icon,name,qty]) => (
                    <div key={name as string} className="d-item"><div className="d-item-icon">{icon}</div><div><div className="d-item-name">{name as string}</div><div className="d-item-qty">{qty as string}</div></div></div>
                  ))}
                </div>
                <div>
                  <div className="d-progress-label"><span>Picked up</span><span>On the way</span><span>Arriving</span></div>
                  <div className="d-progress-bar"><div className="d-progress-fill" /></div>
                  <div className="d-eta">4<small> min away</small></div>
                </div>
              </div>
              <div className="float-pill">🛵 Rohan is nearby!</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="hiw" className="hiw-section">
        <div className="section-eyebrow">The process</div>
        <h2 className="hiw-heading">Four steps.<br />Ten minutes.</h2>
        <div className="hiw-grid">
          {[['01','acid','🛒','Browse','10,000+ products. Groceries, snacks, personal care — curated for your city\'s taste.'],['02','orange','⚡','Order','One tap. Payment done. Our AI picks the nearest dark store stocked with your items.'],['03','violet','📍','Track Live','Real-time GPS tracking. Watch your rider navigate to you on the live map.'],['04','white','🎉','Receive','Fresh, sealed, fast. Smile when the door opens. That\'s the Eeshuu promise.']].map(([step,cls,icon,title,desc]) => (
            <div key={step as string} className="hiw-card">
              <div className="hiw-step"><span>{step}</span><div className="hiw-step-bar" /></div>
              <div className={`hiw-icon ${cls}`}>{icon}</div>
              <div className="hiw-title">{title as string}</div>
              <p className="hiw-desc">{desc as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      

      {/* TESTIMONIALS */}
      <section className="testi-section">
        <h2 className="testi-heading">People <em style={{ fontStyle:'normal',color:'var(--acid)' }}>love</em> Eeshuu.</h2>
        <TestiCarousel />
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg-orb" />
        <h2 className="cta-h2" id="cta-h2">Stop waiting.<br /><span className="line2">Start living.</span></h2>
        <p className="cta-sub">Join 2.1 million people who&apos;ve upgraded to instant.</p>
        <div style={{ display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',position:'relative',zIndex:1 }}>
          <a href="#auth" className="btn-primary" style={{ fontSize:17,padding:'20px 52px' }}>Create Account →</a>
          <a href="#auth" className="btn-ghost" style={{ color:'rgba(247,244,239,.5)' }} onClick={() => switchTab('login')}>Already have an account? Sign in</a>
        </div>
      </section>

      {/* AUTH SECTION */}
      <section id="auth">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-bg" />
          <div className="auth-left-content">
            <div className="auth-brand"><div className="nav-dot" />Eeshuu<span style={{ color:'var(--acid)' }}>.</span></div>
            <h2 className="auth-tagline">Your city.<br />Your speed.<br /><em>Your Eeshuu.</em></h2>
            <p className="auth-sub">Join the network that&apos;s redefining convenience for a billion people. Fast, fresh, and always there when you need it most.</p>
            <div className="auth-stats">
              <div><div className="auth-stat-num">10<span style={{ color:'var(--acid)' }}>m</span></div><div className="auth-stat-label">Avg delivery</div></div>
              <div><div className="auth-stat-num">147</div><div className="auth-stat-label">Cities live</div></div>
              <div><div className="auth-stat-num">4.9<span style={{ color:'var(--acid)' }}>★</span></div><div className="auth-stat-label">App rating</div></div>
            </div>
          </div>
          <div style={{ position:'absolute',bottom:0,left:0,right:0,height:200,background:'linear-gradient(transparent,rgba(200,255,0,.04))',pointerEvents:'none' }} />
        </div>

        {/* Right panel */}
        <div className="auth-right" id="auth-panel">
          <div className="auth-tabs">
            <button className={cn('auth-tab', tab === 'login' && 'active')} onClick={() => switchTab('login')}>Sign in</button>
            <button className={cn('auth-tab', tab === 'register' && 'active')} onClick={() => switchTab('register')}>Create account</button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <div id="form-login">
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input type="email" className={cn('form-input', loginForm.formState.errors.email && 'error')} placeholder="you@example.com" {...loginForm.register('email')} />
                  {loginForm.formState.errors.email && <div className="form-error">{loginForm.formState.errors.email.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-wrap">
                    <input type={showLoginPass ? 'text' : 'password'} className={cn('form-input', loginForm.formState.errors.password && 'error')} placeholder="••••••••" {...loginForm.register('password')} />
                    <button type="button" onClick={() => setShowLoginPass(p => !p)}>{showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {loginForm.formState.errors.password && <div className="form-error">{loginForm.formState.errors.password.message}</div>}
                </div>
                <button type="submit" className="form-submit" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : 'Sign in →'}
                </button>
              </form>
              <div className="demo-strip">
                <div className="demo-label">Quick demo access</div>
                <div className="demo-pills">
                  {DEMO.map(d => (
                    <button key={d.cls} className={`demo-pill ${d.cls}`} type="button" onClick={() => fillDemo(d.email)}>{d.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <div id="form-register">
              <form onSubmit={regForm.handleSubmit(onRegister)}>
                <div className="role-selector">
                  {(['customer','delivery'] as const).map(r => (
                    <button key={r} type="button" className={cn('role-btn', regRole === r && 'active')} onClick={() => regForm.setValue('role', r)}>
                      {r === 'customer' ? '👤 Customer' : '🛵 Delivery Partner'}
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input type="text" className={cn('form-input', regForm.formState.errors.name && 'error')} placeholder="Your name" {...regForm.register('name')} />
                  {regForm.formState.errors.name && <div className="form-error">{regForm.formState.errors.name.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input type="email" className={cn('form-input', regForm.formState.errors.email && 'error')} placeholder="you@example.com" {...regForm.register('email')} />
                  {regForm.formState.errors.email && <div className="form-error">{regForm.formState.errors.email.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input type="tel" className="form-input" placeholder="+91 9876543210" {...regForm.register('phone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-wrap">
                    <input type={showRegPass ? 'text' : 'password'} className={cn('form-input', regForm.formState.errors.password && 'error')} placeholder="Min 8 chars + uppercase + number" {...regForm.register('password')} />
                    <button type="button" onClick={() => setShowRegPass(p => !p)}>{showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {regForm.formState.errors.password && <div className="form-error">{regForm.formState.errors.password.message}</div>}
                </div>
                <button type="submit" className="form-submit" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : 'Create account →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">Eeshuu<span>.</span></div>
        <div className="footer-copy">© 2025 Eeshuu Technologies Pvt. Ltd. · Blink &amp; It&apos;s There.</div>
      </footer>

      {/* Mobile Auth FAB */}
      <button 
        className={`mobile-auth-fab ${showMobileFab ? 'show' : ''}`}
        onClick={scrollToAuth}
        aria-label="Go to sign in"
      >
        👤
      </button>
    </>
  )
}
