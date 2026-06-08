import { useState, useRef, useEffect } from 'react'
import { X, Camera, Pencil, Trash2, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CharacterPickerModal from './CharacterPickerModal'

export default function ManageAccountsModal({ game, accounts, onClose, onRefresh }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImage, setEditImage] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [characters, setCharacters] = useState({}) // accountId -> [char objects]
  const [pickerAccount, setPickerAccount] = useState(null)
  const avatarFileRef = useRef()

  useEffect(() => { fetchAllCharacters() }, [accounts])

  async function fetchAllCharacters() {
    if (!accounts.length) return
    const { data } = await supabase
      .from('account_characters')
      .select('account_id, characters(id, image_url, name)')
      .in('account_id', accounts.map(a => a.id))
    const map = {}
    for (const row of (data || [])) {
      if (!map[row.account_id]) map[row.account_id] = []
      if (row.characters) map[row.account_id].push(row.characters)
    }
    setCharacters(map)
  }

  function startEdit(account) {
    setEditingId(account.id)
    setEditName(account.name)
    setEditDesc(account.description || '')
    setEditImage(account.image_url || '')
  }

  function handleAvatarFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setEditImage(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
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
      <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleAvatarFile} className="hidden" />

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
                  <div className="flex justify-center mb-4">
                    <button onClick={() => avatarFileRef.current.click()} className="relative group">
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
                    <button onClick={() => setEditImage('')} className="w-full text-xs text-red-400 text-center mb-2">Remove avatar</button>
                  )}
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-600 rounded-xl px-3 py-2.5 text-white text-sm outline-none mb-2" placeholder="Name" autoFocus />
                  <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-slate-600 rounded-xl px-3 py-2.5 text-white text-sm outline-none mb-3" placeholder="Description (optional)" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded-xl text-sm">Cancel</button>
                    <button onClick={saveEdit} disabled={!editName.trim()} className="flex-1 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50" style={{ backgroundColor: game.color }}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
                      style={{ backgroundColor: account.image_url ? 'transparent' : game.color + '33', border: `2px solid ${game.color}` }}>
                      {account.image_url
                        ? <img src={account.image_url} alt={account.name} className="w-full h-full object-cover" />
                        : <span style={{ color: game.color }}>{account.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{account.name}</div>
                      {account.description && <div className="text-xs text-slate-400 truncate">{account.description}</div>}
                    </div>
                    <button onClick={() => startEdit(account)} className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(account.id)} className="p-1.5 hover:bg-red-900 rounded-lg text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Characters */}
                  <div className="border-t border-slate-600 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Users size={11} className="text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">Characters</span>
                      </div>
                      <button
                        onClick={() => setPickerAccount(account)}
                        className="text-xs px-2 py-0.5 rounded-md hover:bg-slate-600 transition-colors"
                        style={{ color: game.color }}
                      >
                        Edit
                      </button>
                    </div>
                    {(characters[account.id] || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(characters[account.id] || []).map(char => (
                          <div key={char.id} className="relative">
                            <img src={char.image_url} alt={char.name || ''} className="w-10 h-10 rounded-lg object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setPickerAccount(account)} className="text-xs text-slate-500 hover:text-slate-300">
                        + Add characters
                      </button>
                    )}
                  </div>
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

      {pickerAccount && (
        <CharacterPickerModal
          game={game}
          account={pickerAccount}
          onClose={() => setPickerAccount(null)}
          onSave={() => { setPickerAccount(null); fetchAllCharacters() }}
        />
      )}
    </div>
  )
}
