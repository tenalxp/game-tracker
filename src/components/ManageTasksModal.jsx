import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ManageTasksModal({ game, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('game_tasks')
      .select('*')
      .eq('game_id', game.id)
      .order('sort_order')
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
    })
    setNewTask('')
    setSaving(false)
    fetchTasks()
  }

  async function toggleTask(task) {
    await supabase.from('game_tasks').update({ enabled: !task.enabled }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, enabled: !t.enabled } : t))
  }

  async function deleteTask(id) {
    await supabase.from('game_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Manage Daily Tasks</h2>
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
            <div className="text-slate-500 text-center py-8">No tasks yet. Add one below.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3">
                  <span className={`flex-1 text-sm ${!task.enabled ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.name}
                  </span>
                  <button
                    onClick={() => toggleTask(task)}
                    className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title={task.enabled ? 'Disable task' : 'Enable task'}
                  >
                    {task.enabled
                      ? <ToggleRight size={24} style={{ color: game.color }} />
                      : <ToggleLeft size={24} />
                    }
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-700">
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
              className="px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-1"
              style={{ backgroundColor: game.color }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Disable a task to hide it from the checklist temporarily.
          </p>
        </div>
      </div>
    </div>
  )
}
