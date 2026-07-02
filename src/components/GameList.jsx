import { useState, useRef } from 'react'
import { Plus, Gamepad2, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import DraggableImage from './DraggableImage'

const DEFAULT_COLOR = '#6366f1'

export default function GameList({ games, onSelect, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePos, setImagePos] = useState('50% 50%')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const fileRef = useRef()

  function openAdd() {
    setName('')
    setImageUrl('')
    setImagePos('50% 50%')
    setEditGame(null)
    setShowAdd(true)
  }

  function openEdit(e, game) {
    e.stopPropagation()
    setName(game.name)
    setImageUrl(game.image_url || '')
    setImagePos(game.image_position || '50% 50%')
    setEditGame(game)
    setShowAdd(true)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
    setImagePos('50% 50%')
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(),
      color: DEFAULT_COLOR,
      image_url: imageUrl || null,
      image_position: imagePos,
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
        <div className="text-center py-20 text-slate-400">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No games yet. Click "Add Game" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {games.map(game => (
            <div key={game.id} className="relative group flex flex-col">
              <button
                onClick={() => onSelect(game)}
                className="flex flex-col items-center text-center active:scale-95 transition-transform"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white/8 shadow-lg mb-2">
                  {game.image_url
                    ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" style={{ objectPosition: game.image_position || '50% 50%' }} />
                    : <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl bg-indigo-600/30">
                        {game.name.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>
                <span className="font-semibold text-sm text-center leading-tight line-clamp-2">{game.name}</span>
              </button>
              {/* Edit/Delete */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  onClick={(e) => openEdit(e, game)}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); setDeleteId(game.id) }}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600/70 text-white transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">{editGame ? 'Edit Game' : 'Add New Game'}</h2>
            <input
              type="text"
              placeholder="Game name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />

            {imageUrl ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <DraggableImage
                  src={imageUrl}
                  position={imagePos}
                  onPositionChange={setImagePos}
                  divClassName="w-24 h-24 rounded-xl border-2 border-dashed border-indigo-500"
                />
                <div className="flex gap-4">
                  <button onClick={() => fileRef.current.click()} className="text-xs text-indigo-400 hover:text-indigo-300">Change image</button>
                  <button onClick={() => { setImageUrl(''); setImagePos('50% 50%') }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current.click()}
                className="w-full bg-white/8 hover:bg-white/10 rounded-xl py-3 text-sm text-slate-300 transition-colors mb-4"
              >
                Choose image from device
              </button>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-white/8 hover:bg-white/10 py-3 rounded-xl font-medium transition-colors"
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
          <div className="bg-white/5 backdrop-blur-md rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete this game?</h2>
            <p className="text-slate-400 text-sm mb-6">All accounts and tasks will be deleted too.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-white/8 hover:bg-white/10 py-3 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={deleteGame} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
