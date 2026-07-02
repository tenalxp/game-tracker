import { useState, useRef, useEffect } from 'react'
import { X, Camera, Pencil, Trash2, Users, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CharacterPickerModal from './CharacterPickerModal'
import DraggableImage from './DraggableImage'
import { ColorPicker } from './AccountList'

export default function ManageAccountsModal({ game, accounts, onClose, onRefresh }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImage, setEditImage] = useState('')
  const [editImagePos, setEditImagePos] = useState('50% 50%')
  const [editColor, setEditColor] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [characters, setCharacters] = useState({})
  const [pickerAccount, setPickerAccount] = useState(null)
  const avatarFileRef = useRef()

  useEffect(() => { fetchAllCharacters() }, [accounts])

  async function fetchAllCharacters() {
    if (!accounts.length) return
    const { data } = await supabase
      .from('account_characters')
      .select('account_id, characters(id, image_url, name, image_position)')
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
    setEditImagePos(account.image_position || '50% 50%')
    setEditColor(account.color || null)
  }

  function handleAvatarFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setEditImage(ev.target.result)
    reader.readAsDataURL(file)
    setEditImagePos('50% 50%')
    e.target.value = ''
  }

  async function saveEdit() {
    await supabase.from('game_accounts').update({
      name: editName.trim(),
      description: editDesc.trim() || null,
      image_url: editImage || null,
      image_position: editImagePos,
      color: editColor || null,
    }).eq('id', editingId)
    setEditingId(null)
    onRefresh()
  }

  async function deleteAccount() {
    await supabase.from('game_accounts').delete().eq('id', deleteId)
    setDeleteId(null)
    onRefresh()
  }

  async function duplicateAccount(account) {
    // Copy account
    const { data: newAcc } = await supabase.from('game_accounts').insert({
      game_id: game.id,
      name: account.name + ' (copy)',
      description: account.description || null,
      image_url: account.image_url || null,
      image_position: account.image_position || '50% 50%',
      color: account.color || null,
      sort_order: accounts.length,
    }).select().single()
    if (!newAcc) return

    // Copy characters
    const chars = characters[account.id] || []
    if (chars.length) {
      await supabase.from('account_characters').insert(
        chars.map((c, i) => ({ account_id: newAcc.id, character_id: c.id, sort_order: i }))
      )
    }

    // Copy resources
    const { data: res } = await supabase
      .from('account_resources').select('*').eq('account_id', account.id).order('sort_order')
    if (res?.length) {
      await supabase.from('account_resources').insert(
        res.map(r => ({ account_id: newAcc.id, name: r.name, image_url: r.image_url, quantity: r.quantity, sort_order: r.sort_order, category: r.category }))
      )
    }

    onRefresh()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleAvatarFile} className="hidden" />

      <div className="bg-white/5 backdrop-blur-md rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="font-bold text-lg">Manage Accounts</h2>
            <p className="text-slate-400 text-sm">{game.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {accounts.map(account => (
            <div key={account.id} className="bg-white/8 rounded-xl p-4">
              {editingId === account.id ? (
                <div>
                  <div className="flex justify-center mb-3">
                    {editImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <DraggableImage
                          src={editImage}
                          position={editImagePos}
                          onPositionChange={setEditImagePos}
                          divClassName="w-16 h-16 rounded-full border-2 border-dashed border-indigo-500"
                        />
                        <div className="flex gap-4">
                          <button onClick={() => avatarFileRef.current.click()} className="text-xs text-indigo-400 hover:text-indigo-300">Change photo</button>
                          <button onClick={() => { setEditImage(''); setEditImagePos('50% 50%') }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => avatarFileRef.current.click()} className="relative group">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10 border-2 border-slate-500 group-hover:border-indigo-400 transition-colors">
                          <Camera size={22} className="text-slate-400" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1">
                          <Pencil size={9} className="text-white" />
                        </div>
                      </button>
                    )}
                  </div>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full bg-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none mb-2" placeholder="Name" autoFocus />
                  <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none mb-2" placeholder="Description (optional)" />
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-1.5">Background color</p>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-white/10 hover:bg-white/50 py-2 rounded-xl text-sm">Cancel</button>
                    <button onClick={saveEdit} disabled={!editName.trim()} className="flex-1 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50" style={{ backgroundColor: game.color }}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
                      style={{ backgroundColor: account.image_url ? 'transparent' : game.color + '33', border: `2px solid ${game.color}` }}>
                      {account.image_url
                        ? <img src={account.image_url} alt={account.name} className="w-full h-full object-cover" style={{ objectPosition: account.image_position || '50% 50%' }} />
                        : <span style={{ color: game.color }}>{account.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{account.name}</div>
                      {account.description && <div className="text-xs text-slate-400 truncate">{account.description}</div>}
                    </div>
                    <button onClick={() => startEdit(account)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => duplicateAccount(account)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setDeleteId(account.id)} className="p-1.5 hover:bg-red-900 rounded-lg text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="border-t border-white/15 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Users size={11} className="text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">Characters</span>
                      </div>
                      <button onClick={() => setPickerAccount(account)} className="text-xs px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: game.color }}>
                        Edit
                      </button>
                    </div>
                    {(characters[account.id] || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(characters[account.id] || []).map(char => (
                          <img key={char.id} src={char.image_url} alt={char.name || ''} className="w-10 h-10 rounded-lg object-cover" style={{ objectPosition: char.image_position || '50% 50%' }} />
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setPickerAccount(account)} className="text-xs text-slate-400 hover:text-slate-300">
                        + Add characters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-slate-400 text-center py-8 text-sm">No accounts yet.</div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete this account?</h2>
            <p className="text-slate-400 text-sm mb-6">All daily history will be deleted too.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-white/8 hover:bg-white/10 py-3 rounded-xl font-medium">Cancel</button>
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
