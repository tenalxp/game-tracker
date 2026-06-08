import { useState, useRef } from 'react'
import { Plus, Gamepad2, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DEFAULT_COLOR = '#6366f1'

export default function GameList({ games, onSelect, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const fileRef = useRef()

  function openAdd() {
    setName('')
    setImageUrl('')
    setEditGame(null)
    setShowAdd(true)
  }

  function openEdit(e, game) {
    e.stopPropagation()
    setName(game.name)
    setImageUrl(game.image_url || '')
    setEditGame(game)
    setShowAdd(true)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(),
      color: DEFAULT_COLOR,
      image_url: imageUrl || null,
    }
    if (editGame) {
      await supabase.from('games').update(payload).eq('id', editGame.id)
    } else {
      await supabase.from('games').insert(payload)
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
          Add Game
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No games yet. Click "Add Game" to start.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => onSelect(game)}
              className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-xl p-4 transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden bg-slate-700">
                {game.image_url
                  ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover rounded-xl" />
                  : <span>{game.name.charAt(0).toUpperCase()}</span>
                }
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
            <h2 className="text-lg font-bold mb-4">{editGame ? 'Edit Game' : 'Add New Game'}</h2>
            <input
              type="text"
              placeholder="Game name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileRef.current.click()}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-xl py-3 text-sm text-slate-300 transition-colors mb-3"
            >
              {imageUrl ? 'Change image' : 'Choose image from device'}
            </button>
            {imageUrl && (
              <div className="flex items-center gap-3 mb-4">
                <img src={imageUrl} alt="preview" className="w-12 h-12 rounded-xl object-cover" />
                <span className="text-slate-400 text-sm flex-1">Image selected</span>
                <button onClick={() => setImageUrl('')} className="text-red-400 text-sm">Remove</button>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete this game?</h2>
            <p className="text-slate-400 text-sm mb-6">All accounts and tasks will be deleted too.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={deleteGame} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
