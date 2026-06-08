import { useState } from 'react'
import { Plus, Gamepad2, Pencil, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

export default function GameList({ games, onSelect, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  function openAdd() {
    setName('')
    setColor(COLORS[0])
    setEditGame(null)
    setShowAdd(true)
  }

  function openEdit(e, game) {
    e.stopPropagation()
    setName(game.name)
    setColor(game.color)
    setEditGame(game)
    setShowAdd(true)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    if (editGame) {
      await supabase.from('games').update({ name: name.trim(), color }).eq('id', editGame.id)
    } else {
      await supabase.from('games').insert({ name: name.trim(), color })
    }
    setSaving(false)
    setShowAdd(false)
    onRefresh()
  }

  async function deleteGame() {
    await supabase.from('games').delete().eq('id', deleteId)
    setDeleteId(null)
    onRefresh()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-indigo-400" size={28} />
          <h1 className="text-2xl font-bold">Game Tracker</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          เพิ่มเกม
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีเกม กด "เพิ่มเกม" เพื่อเริ่ม</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => onSelect(game)}
              className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-xl p-4 transition-colors text-left group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: game.color }}
              >
                {game.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 font-semibold text-lg">{game.name}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  onClick={(e) => openEdit(e, game)}
                  className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                >
                  <Pencil size={16} />
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); setDeleteId(game.id) }}
                  className="p-2 rounded-lg hover:bg-red-900 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">{editGame ? 'แก้ไขเกม' : 'เพิ่มเกมใหม่'}</h2>
            <input
              type="text"
              placeholder="ชื่อเกม"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <p className="text-sm text-slate-400 mb-2">สี</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                disabled={saving || !name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl font-medium transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">ลบเกมนี้?</h2>
            <p className="text-slate-400 text-sm mb-6">จะลบ accounts และ tasks ทั้งหมดด้วย</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={deleteGame}
                className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
