import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ManageTasksModal({ game, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [newResetDays, setNewResetDays] = useState(1)
  const [newResetHour, setNewResetHour] = useState(3)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editResetDays, setEditResetDays] = useState(1)
  const [editResetHour, setEditResetHour] = useState(3)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('game_tasks').select('*').eq('game_id', game.id).order('sort_order')
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTask.trim()) return
    setSaving(true)
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order)) + 1 : 0
    await supabase.from('game_tasks').insert({
      game_id: game.id,
      name: newTask.trim(),
      enabled: true,
      sort_order: maxOrder,
      reset_days: newResetDays,
      reset_hour: newResetHour,
    })
    setNewTask('')
    setNewResetDays(1)
    setNewResetHour(3)
    setSaving(false)
    fetchTasks()
  }

  async function toggleTask(task) {
    await supabase.from('game_tasks').update({ enabled: !task.enabled }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, enabled: !t.enabled } : t))
  }

  async function saveEdit(task) {
    await supabase.from('game_tasks').update({ reset_days: editResetDays, reset_hour: editResetHour }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reset_days: editResetDays, reset_hour: editResetHour } : t))
    setEditingId(null)
  }

  async function deleteTask(id) {
    await supabase.from('game_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function taskLabel(task) {
    const days = task.reset_days || 1
    const hour = task.reset_hour ?? 3
    const timeStr = `${String(hour).padStart(2, '0')}:00`
    if (days === 1) return `Daily @ ${timeStr}`
    return `Every ${days}d @ ${timeStr}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Manage Tasks</h2>
            <p className="text-slate-400 text-sm">{game.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-slate-500 text-center py-8">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-slate-500 text-center py-8">No tasks yet.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="bg-slate-700 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex-1 text-sm font-medium ${!task.enabled ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.name}
                    </span>
                    <button onClick={() => toggleTask(task)} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                      {task.enabled
                        ? <ToggleRight size={22} style={{ color: game.color }} />
                        : <ToggleLeft size={22} />
                      }
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {editingId === task.id ? (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Every</span>
                        <input type="number" min={1} value={editResetDays} onChange={e => setEditResetDays(Number(e.target.value))}
                          className="w-14 bg-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                        <span className="text-xs text-slate-400">days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">@</span>
                        <input type="number" min={0} max={23} value={editResetHour} onChange={e => setEditResetHour(Number(e.target.value))}
                          className="w-14 bg-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                        <span className="text-xs text-slate-400">:00</span>
                      </div>
                      <button onClick={() => saveEdit(task)} className="ml-auto text-green-400 hover:text-green-300">
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(task.id); setEditResetDays(task.reset_days || 1); setEditResetHour(task.reset_hour ?? 3) }}
                      className="flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-md hover:bg-slate-600 transition-colors"
                      style={{ color: game.color }}
                    >
                      {taskLabel(task)} <Pencil size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-700 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New task name"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="flex-1 bg-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 outline-none focus:ring-2 text-sm"
            />
            <button
              onClick={addTask}
              disabled={saving || !newTask.trim()}
              className="px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 flex items-center gap-1"
              style={{ backgroundColor: game.color }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Every</span>
            <input type="number" min={1} value={newResetDays} onChange={e => setNewResetDays(Number(e.target.value))}
              className="w-14 bg-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none" />
            <span className="text-xs text-slate-500">days @</span>
            <input type="number" min={0} max={23} value={newResetHour} onChange={e => setNewResetHour(Number(e.target.value))}
              className="w-14 bg-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none" />
            <span className="text-xs text-slate-500">:00 (Bangkok time)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
