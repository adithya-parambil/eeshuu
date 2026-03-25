'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { DepthGrid } from '@/components/background/depth-grid'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative">
      <DepthGrid />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <p className="text-8xl font-bold text-white/5 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-white/30 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Go home
        </Link>
      </motion.div>
    </div>
  )
}
