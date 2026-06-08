import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import GameList from './components/GameList'
import AccountList from './components/AccountList'
import TaskList from './components/TaskList'

export default function App() {
  const [view, setView] = useState('games')
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGames()
  }, [])

  async function fetchGames() {
    const { data } = await supabase.from('games').select('*').order('created_at')
    setGames(data || [])
    setLoading(false)
  }

  function selectGame(game) {
    setSelectedGame(game)
    setView('accounts')
  }

  function selectAccount(account) {
    setSelectedAccount(account)
    setView('tasks')
  }

  function goBack() {
    if (view === 'tasks') {
      setSelectedAccount(null)
      setView('accounts')
    } else if (view === 'accounts') {
      setSelectedGame(null)
      setView('games')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {view === 'games' && (
        <GameList games={games} onSelect={selectGame} onRefresh={fetchGames} />
      )}
      {view === 'accounts' && (
        <AccountList game={selectedGame} onSelect={selectAccount} onBack={goBack} />
      )}
      {view === 'tasks' && (
        <TaskList game={selectedGame} account={selectedAccount} onBack={goBack} />
      )}
    </div>
  )
}
