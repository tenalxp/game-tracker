import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import GameList from './components/GameList'
import AccountList from './components/AccountList'
import PinLock from './components/PinLock'

function GlowOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-10%', left: '15%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-5%',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('games')
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGames() }, [])

  async function fetchGames() {
    const { data } = await supabase.from('games').select('*').order('created_at')
    setGames(data || [])
    setLoading(false)
  }

  function selectGame(game) { setSelectedGame(game); setView('accounts') }
  function goBack() { setSelectedGame(null); setView('games') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlowOrbs />
        <div className="text-slate-400 text-lg" style={{ position: 'relative', zIndex: 1 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-100" style={{ position: 'relative' }}>
      <GlowOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PinLock>
          {view === 'games' && <GameList games={games} onSelect={selectGame} onRefresh={fetchGames} />}
          {view === 'accounts' && <AccountList game={selectedGame} onBack={goBack} />}
        </PinLock>
      </div>
    </div>
  )
}
