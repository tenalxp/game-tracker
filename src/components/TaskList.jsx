import { useState, useEffect } from 'react'
import { ArrowLeft, Settings, CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getGameDayForHour, formatGameDay, getTimeUntilResetHour, daysBetween } from '../lib/dateUtils'
import ManageTasksModal from './ManageTasksModal'

export default function TaskList({ game, account, onBack }) {
  const [tasks, setTasks] = useState([])
  const [completionMap, setCompletionMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showManage, setShowManage] = useState(false)
  const [toggling, setToggling] = useState(new Set())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { fetchData() }, [account.id])

  async function fetchData() {
    const [tasksRes, completionsRes] = await Promise.all([
      supabase.from('game_tasks').select('*').eq('game_id', game.id).eq('enabled', true).order('sort_order'),
      supabase.from('task_completions').select('task_id, game_day').eq('account_id', account.id).order('game_day', { ascending: false }),
    ])
    setTasks(tasksRes.data || [])
    const map = {}
    for (const c of (completionsRes.data || [])) {
      if (!map[c.task_id]) map[c.task_id] = c.game_day
    }
    setCompletionMap(map)
    setLoading(false)
  }

  function isDone(task) {
    const lastDay = completionMap[task.id]
    if (!lastDay) return false
    const resetHour = task.reset_hour ?? 3
    const resetDays = task.reset_days || 1
    const today = getGameDayForHour(resetHour)
    if (resetDays === 1) return lastDay === today
    return daysBetween(lastDay, today) < resetDays
  }

  function taskCountdown(task) {
    const resetHour = task.reset_hour ?? 3
    const resetDays = task.reset_days || 1
    if (!isDone(task)) return null
    if (resetDays === 1) {
      return `Resets in ${getTimeUntilResetHour(resetHour)}`
    }
    const today = getGameDayForHour(resetHour)
    const lastDay = completionMap[task.id]
    const remaining = resetDays - daysBetween(lastDay, today)
    return `Resets in ${remaining}d`
  }

  async function toggleCompletion(task) {
    if (toggling.has(task.id)) return
    setToggling(prev => new Set([...prev, task.id]))
    const done = isDone(task)
    const resetHour = task.reset_hour ?? 3
    const today = getGameDayForHour(resetHour)
    if (done) {
      const lastDay = completionMap[task.id]
      await supabase.from('task_completions').delete()
        .eq('account_id', account.id).eq('task_id', task.id).eq('game_day', lastDay)
      setCompletionMap(prev => { const m = { ...prev }; delete m[task.id]; return m })
    } else {
      await supabase.from('task_completions').upsert({ account_id: account.id, task_id: task.id, game_day: today })
      setCompletionMap(prev => ({ ...prev, [task.id]: today }))
    }
    setToggling(prev => { const s = new Set(prev); s.delete(task.id); return s })
  }

  const doneCount = tasks.filter(t => isDone(t)).length
  const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0
  const today = getGameDayForHour(3)

  const gameIcon = game.image_url
    ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover rounded-md" />
    : <div className="w-5 h-5 rounded-md" style={{ backgroundColor: game.color }} />

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex-shrink-0">
          <ArrowLeft size={22} />
        </button>
        {/* Account avatar */}
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl"
          style={{
            backgroundColor: account.image_url ? 'transparent' : game.color + '33',
            border: `2px solid ${game.color}`,
          }}
        >
          {account.image_url
            ? <img src={account.image_url} alt={account.name} className="w-full h-full object-cover" />
            : <span style={{ color: game.color }}>{account.name.charAt(0).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded flex-shrink-0 overflow-hidden">
              {gameIcon}
            </div>
            <span className="text-slate-400 text-xs truncate">{game.name}</span>
          </div>
          <h1 className="font-bold text-xl leading-tight truncate">{account.name}</h1>
          {account.description && (
            <p className="text-slate-500 text-xs truncate">{account.description}</p>
          )}
        </div>
        <button onClick={() => setShowManage(true)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0">
          <Settings size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{formatGameDay(today)}</span>
          <span className="text-sm font-semibold" style={{ color: progress === 100 ? '#22c55e' : game.color }}>
            {doneCount}/{tasks.length}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22c55e' : game.color }} />
        </div>
        {progress === 100 && tasks.length > 0 && (
          <p className="text-green-400 text-sm text-center mt-2 font-medium">✓ All done!</p>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p>No tasks yet.</p>
          <button onClick={() => setShowManage(true)} className="mt-3 text-sm underline" style={{ color: game.color }}>Add tasks</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const done = isDone(task)
            const busy = toggling.has(task.id)
            const countdown = taskCountdown(task)
            const resetHour = task.reset_hour ?? 3
            const resetDays = task.reset_days || 1
            const scheduleLabel = !done
              ? (resetDays === 1
                  ? `Resets at ${String(resetHour).padStart(2, '0')}:00`
                  : `Every ${resetDays}d @ ${String(resetHour).padStart(2, '0')}:00`)
              : null

            return (
              <button
                key={task.id}
                onClick={() => toggleCompletion(task)}
                disabled={busy}
                className={`w-full flex items-center gap-4 rounded-xl p-4 transition-all text-left ${done ? 'bg-slate-800/50' : 'bg-slate-800 hover:bg-slate-700 active:scale-[0.98]'}`}
              >
                {done
                  ? <CheckCircle2 size={24} style={{ color: game.color }} className="flex-shrink-0" />
                  : <Circle size={24} className="text-slate-500 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${done ? 'line-through text-slate-400' : 'text-white'}`}>
                    {task.name}
                  </div>
                  {countdown && (
                    <div className="text-xs mt-0.5 text-orange-400 font-mono">{countdown}</div>
                  )}
                  {scheduleLabel && (
                    <div className="text-xs mt-0.5 text-slate-500">{scheduleLabel}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showManage && <ManageTasksModal game={game} onClose={() => { setShowManage(false); fetchData() }} />}
    </div>
  )
}
