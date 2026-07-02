import { useState, useEffect } from 'react'

const PIN_KEY = 'game_tracker_pin'

function PinDots({ length, filled }) {
  return (
    <div className="flex gap-4 justify-center my-8">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < filled
              ? 'bg-indigo-400 border-indigo-400 scale-110'
              : 'border-slate-500 bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

function NumPad({ onPress, onDelete }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {keys.map((k, i) => {
        if (k === null) return <div key={i} />
        if (k === 'del') return (
          <button
            key={i}
            onClick={onDelete}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-slate-400 text-xl"
          >
            ⌫
          </button>
        )
        return (
          <button
            key={i}
            onClick={() => onPress(String(k))}
            className="h-16 rounded-2xl bg-white/8 hover:bg-white/15 active:scale-95 transition-all text-white text-2xl font-light"
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}

export default function PinLock({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [storedPin, setStoredPin] = useState(null)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('enter') // 'enter' | 'setup' | 'confirm'
  const [setupPin, setSetupPin] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already unlocked this session
    if (sessionStorage.getItem('pin_unlocked') === '1') {
      setUnlocked(true)
      return
    }
    const pin = localStorage.getItem(PIN_KEY)
    setStoredPin(pin)
    if (!pin) setMode('setup')
    else setMode('enter')
  }, [])

  function press(digit) {
    if (input.length >= 4) return
    const next = input + digit
    setInput(next)
    setError('')

    if (next.length === 4) {
      setTimeout(() => handleComplete(next), 80)
    }
  }

  function del() {
    setInput(p => p.slice(0, -1))
    setError('')
  }

  function handleComplete(pin) {
    if (mode === 'enter') {
      if (pin === storedPin) {
        sessionStorage.setItem('pin_unlocked', '1')
        setUnlocked(true)
      } else {
        triggerShake('Wrong PIN')
      }
    } else if (mode === 'setup') {
      setSetupPin(pin)
      setMode('confirm')
      setInput('')
    } else if (mode === 'confirm') {
      if (pin === setupPin) {
        localStorage.setItem(PIN_KEY, pin)
        setStoredPin(pin)
        sessionStorage.setItem('pin_unlocked', '1')
        setUnlocked(true)
      } else {
        triggerShake('PINs don\'t match — try again')
        setMode('setup')
        setSetupPin('')
        setInput('')
      }
    }
  }

  function triggerShake(msg) {
    setError(msg)
    setShake(true)
    setInput('')
    setTimeout(() => setShake(false), 500)
  }

  if (unlocked) return children

  const title = mode === 'enter'
    ? 'Enter PIN'
    : mode === 'setup'
    ? 'Set up PIN'
    : 'Confirm PIN'

  const subtitle = mode === 'enter'
    ? 'Enter your 4-digit PIN to continue'
    : mode === 'setup'
    ? 'Choose a 4-digit PIN'
    : 'Enter PIN again to confirm'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Glow orbs inherited from App */}
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-3xl">
          🔒
        </div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>

        <div className={shake ? 'animate-shake' : ''}>
          <PinDots length={4} filled={input.length} />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 -mt-4">{error}</p>
        )}

        <NumPad onPress={press} onDelete={del} />

        {mode === 'enter' && storedPin && (
          <button
            onClick={() => {
              if (confirm('Reset PIN? You\'ll need to set a new one.')) {
                localStorage.removeItem(PIN_KEY)
                setStoredPin(null)
                setMode('setup')
                setInput('')
                setError('')
              }
            }}
            className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Forgot PIN?
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          20% { transform: translateX(-8px) }
          40% { transform: translateX(8px) }
          60% { transform: translateX(-6px) }
          80% { transform: translateX(6px) }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
