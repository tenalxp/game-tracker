import { useState, useRef } from 'react'
import { X, Camera, Pencil, Trash2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ManageAccountsModal({ game, accounts, onClose, onRefresh }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImage, setEditImage] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const fileRef = useRef()

  function startEdit(account) {
    setEditingId(account.id)
    setEditName(account.name)
    setEditDesc(account.description || '')
    setEditImage(account.image_url || '')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setEditImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function saveEdit() {
    await supabase.from('game_accounts').update({
      name: editName.trim(),
      description: editDesc.trim() || null,
      image_url: editImage || null,
    }).eq('id', editingId)
    setEditingId(null)
    onRefresh()
  }

  async function deleteAccount() {
    await supabase.from('game_accounts').delete().eq('id', deleteId)
    setDeleteId(null)
    onRefresh()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Manage Accounts</h2>
            <p className="text-slate-400 text-sm">{game.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {accounts.map(account => (
            <div key={account.id} className="bg-slate-700 rounded-xl p-4">
              {editingId === account.id ? (
                <div>
                  {/* Image upload */}
                  <div className="flex justify-center mb-4">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    <button onClick={() => fileRef.current.click()} className="relative group">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-slate-600 border-2 border-slate-500 group-hover:border-indigo-400 transition-colors">
                        {editImage
                          ? <img src={editImage} alt="preview" className="w-full h-full object-cover" />
                          : <Camera size={22} className="text-slate-400" />
                        }
                      </div>
                      <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1">
                        <Pencil size={9} className="text-white" />
                      </div>
                    </button>
                  </div>
                  {editImage && (
                    <button onClick={() => setEditImage('')} className="w-full text-xs text-red-400 text-center mb-2 hover:text-red-300">Remove image</button>
                  )}
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-600 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-1 mb-2"
                    placeholder="Name"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-slate-600 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-1 mb-3"
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded-xl text-sm transition-colors">Cancel</button>
                    <button onClick={saveEdit} disabled={!editName.trim()} className="flex-1 py-2 rounded-xl text-sm text-white font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: game.color }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
                    style={{ backgroundColor: account.image_url ? 'transparent' : game.color + '33', border: `2px solid ${game.color}` }}
                  >
                    {account.image_url
                      ? <img src={account.image_url} alt={account.name} className="w-full h-full object-cover" />
                      : <span style={{ color: game.color }}>{account.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{account.name}</div>
                    {account.description && <div className="text-xs text-slate-400 truncate">{account.description}</div>}
                  </div>
                  <button onClick={() => startEdit(account)} className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteId(account.id)} className="p-2 hover:bg-red-900 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-slate-500 text-center py-8 text-sm">No accounts yet.</div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete this account?</h2>
            <p className="text-slate-400 text-sm mb-6">All daily history will be deleted too.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium">Cancel</button>
              <button onClick={deleteAccount} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
