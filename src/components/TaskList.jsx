import { useState, useEffect } from 'react'
import { ArrowLeft, Settings, CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getGameDay, formatGameDay, getTimeUntilReset } from '../lib/dateUtils'
import ManageTasksModal from './ManageTasksModal'

export default function TaskList({ game, account, onBack }) {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showManage, setShowManage] = useState(false)
  const [toggling, setToggling] = useState(new Set())
  const [countdown, setCountdown] = useState(getTimeUntilReset())
  const gameDay = getGameDay()

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeUntilReset()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchData()
  }, [account.id])

  async function fetchData() {
    const [tasksRes, completionsRes] = await Promise.all([
      supabase.from('game_tasks').select('*').eq('game_id', game.id).eq('enabled', true).order('sort_order'),
      supabase.from('task_completions').select('task_id').eq('account_id', account.id).eq('game_day', gameDay),
    ])
    setTasks(tasksRes.data || [])
    setCompletions(new Set((completionsRes.data || []).map(c => c.task_id)))
    setLoading(false)
  }

  async function toggleCompletion(task) {
    if (toggling.has(task.id)) return
    setToggling(prev => new Set([...prev, task.id]))
    const done = completions.has(task.id)
    if (done) {
      await supabase.from('task_completions').delete().eq('account_id', account.id).eq('task_id', task.id).eq('game_day', gameDay)
      setCompletions(prev => { const s = new Set(prev); s.delete(task.id); return s })
    } else {
      await supabase.from('task_completions').upsert({ account_id: account.id, task_id: task.id, game_day: gameDay })
      setCompletions(prev => new Set([...prev, task.id]))
    }
    setToggling(prev => { const s = new Set(prev); s.delete(task.id); return s })
  }

  const doneCount = tasks.filter(t => completions.has(t.id)).length
  const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0

  const gameIcon = game.image_url
    ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover rounded-md" />
    : <div className="w-5 h-5 rounded-md" style={{ backgroundColor: game.color }} />

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex-shrink-0 overflow-hidden">
              {gameIcon}
            </div>
            <span className="text-slate-400 text-sm">{game.name}</span>
          </div>
          <h1 className="font-bold text-lg leading-tight">{account.name}</h1>
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowManage(true)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-slate-400">{formatGameDay(gameDay)}</div>
            <div className="text-xs text-slate-500">Reset in <span className="text-orange-400 font-mono font-medium">{countdown}</span></div>
          </div>
          <span className="text-sm font-semibold" style={{ color: progress === 100 ? '#22c55e' : game.color }}>
            {doneCount}/{tasks.length}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22c55e' : game.color }}
          />
        </div>
        {progress === 100 && tasks.length > 0 && (
          <p className="text-green-400 text-sm text-center mt-2 font-medium">✓ All dailies done!</p>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p>No daily tasks yet.</p>
          <button onClick={() => setShowManage(true)} className="mt-3 text-sm underline" style={{ color: game.color }}>
            Add tasks
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const done = completions.has(task.id)
            const busy = toggling.has(task.id)
            return (
              <button
                key={task.id}
                onClick={() => toggleCompletion(task)}
                disabled={busy}
                className={`w-full flex items-center gap-4 rounded-xl p-4 transition-all text-left ${done ? 'bg-slate-800/50 opacity-70' : 'bg-slate-800 hover:bg-slate-700 active:scale-[0.98]'}`}
              >
                {done
                  ? <CheckCircle2 size={24} style={{ color: game.color }} className="flex-shrink-0" />
                  : <Circle size={24} className="text-slate-500 flex-shrink-0" />
                }
                <span className={`font-medium ${done ? 'line-through text-slate-400' : 'text-white'}`}>
                  {task.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {showManage && <ManageTasksModal game={game} onClose={() => { setShowManage(false); fetchData() }} />}
    </div>
  )
}
