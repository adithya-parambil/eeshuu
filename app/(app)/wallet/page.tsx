'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Minus, Loader2, IndianRupee, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { walletApi } from '@/lib/api/wallet'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WalletTransaction } from '@/types'
import { connectSocket, disconnectSocket, isDuplicate } from '@/lib/socket/socket-client'

const EVENTS = {
  WALLET_UPDATED: 'v1:WALLET:UPDATED',
}

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

function TxIcon({ type }: { type: WalletTransaction['type'] }) {
  if (type === 'COMMISSION') return <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--acid)' }} />
  if (type === 'WITHDRAWAL') return <ArrowUpRight className="w-4 h-4 text-rose-400" />
  return <Package className="w-4 h-4 text-violet-400" />
}

function TxLabel({ type }: { type: WalletTransaction['type'] }) {
  if (type === 'COMMISSION') return <span className="text-xs font-medium" style={{ color: 'var(--acid)' }}>Commission</span>
  if (type === 'WITHDRAWAL') return <span className="text-rose-400 text-xs font-medium">Withdrawal</span>
  return <span className="text-violet-400 text-xs font-medium">Refund</span>
}

export default function WalletPage() {
  const user = useAuthStore((s) => s.user)
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [customAmount, setCustomAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(),
      ])
      setBalance(balanceRes.data.data.balance)
      setTransactions(txRes.data.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time wallet updates
  useEffect(() => {
    if (!user || user.role !== 'delivery') return

    const socket = connectSocket('/wallet')

    socket.off(EVENTS.WALLET_UPDATED)
    socket.off('connect')
    socket.off('disconnect')

    socket.on(EVENTS.WALLET_UPDATED, (payload: { userId: string; balance: number; eventId: string }) => {
      if (isDuplicate(payload.eventId)) return
      // Only update if this is for the current user
      if (payload.userId === user.userId) {
        setBalance(payload.balance)
        // Refetch transaction history to show the new transaction
        walletApi.getTransactions()
          .then((r) => setTransactions(r.data.data))
          .catch(() => { })
        toast.success('Wallet balance updated')
      }
    })

    return () => {
      disconnectSocket('/wallet')
    }
  }, [user])

  const handleWithdraw = async (amount: number) => {
    if (!amount || amount <= 0) return
    setProcessing(true)
    try {
      const r = await walletApi.withdraw(amount)
      setBalance(r.data.data.balance)
      // Refresh transactions
      walletApi.getTransactions().then((r) => setTransactions(r.data.data)).catch(() => { })
      toast.success(`₹${amount} withdrawn`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Insufficient balance')
    } finally {
      setProcessing(false)
    }
  }

  const handleCustomWithdraw = () => {
    const amt = parseFloat(customAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    handleWithdraw(amt)
    setCustomAmount('')
  }

  // Only delivery partners have wallets
  if (user?.role !== 'delivery') {
    return (
      <AppShell allowedRoles={['delivery']}>
        <div className="flex items-center justify-center h-64 text-white/30 text-sm">
          Wallet is only available for delivery partners.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell allowedRoles={['delivery']}>
      <div className="px-6 py-8 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Wallet</h1>
          <p className="text-white/30 text-sm mt-0.5">Your earnings & withdrawals</p>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className="rounded-2xl p-8 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #111 100%)', border: '1px solid rgba(200,255,0,0.15)', boxShadow: '0 0 40px rgba(200,255,0,0.05)' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(200,255,0,0.10)', border: '1px solid rgba(200,255,0,0.20)' }}>
            <Wallet className="w-6 h-6" style={{ color: 'var(--acid)' }} />
          </div>
          {loading ? (
            <div className="h-10 w-32 bg-white/10 rounded-xl mx-auto animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-head)' }}>₹{(balance ?? 0).toFixed(2)}</p>
          )}
          <p className="text-sm mt-2" style={{ color: 'rgba(200,255,0,0.45)', fontFamily: 'var(--font-mono)' }}>Available balance</p>
        </motion.div>

        {/* Withdraw */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Withdraw</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
                className="w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] outline-none focus:border-[rgba(200,255,0,0.35)] transition-all placeholder:text-white/25"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCustomWithdraw}
              disabled={processing || !customAmount}
              className="h-11 px-5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-40"
              style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Minus className="w-4 h-4" />Withdraw</>}
            </motion.button>
          </div>
        </motion.div>

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Transaction History</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Wallet className="w-10 h-10 mb-2" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <motion.div
                  key={tx._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <TxIcon type={tx.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TxLabel type={tx.type} />
                    {tx.note && <p className="text-white/30 text-xs truncate">{tx.note}</p>}
                    <p className="text-white/20 text-[10px]">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-semibold',
                      tx.type === 'WITHDRAWAL' ? 'text-rose-400' : 'text-emerald-400',
                    )}>
                      {tx.type === 'WITHDRAWAL' ? '-' : '+'}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-white/25 text-[10px]">bal ₹{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <p className="text-white/20 text-xs text-center mt-6">
          Commission (10% of subtotal) is credited automatically on delivery
        </p>
      </div>
    </AppShell>
  )
}
