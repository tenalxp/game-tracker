import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Settings, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ManageTasksModal from './ManageTasksModal'

export default function AccountList({ game, onSelect, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showTasks, setShowTasks] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchAccounts() }, [game.id])

  async function fetchAccounts() {
    const { data } = await supabase.from('game_accounts').select('*').eq('game_id', game.id).order('created_at')
    setAccounts(data || [])
    setLoading(false)
  }

  function openAdd() {
    setName(''); setDescription(''); setImageUrl('')
    setEditAccount(null); setShowAdd(true)
  }

  function openEdit(e, account) {
    e.stopPropagation()
    setName(account.name)
    setDescription(account.description || '')
    setImageUrl(account.image_url || '')
    setEditAccount(account)
    setShowAdd(true)
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = { name: name.trim(), description: description.trim() || null, image_url: imageUrl || null }
    if (editAccount) {
      await supabase.from('game_accounts').update(payload).eq('id', editAccount.id)
    } else {
      await supabase.from('game_accounts').insert({ game_id: game.id, ...payload })
    }
    setSaving(false); setShowAdd(false); fetchAccounts()
  }

  async function deleteAccount() {
    await supabase.from('game_accounts').delete().eq('id', deleteId)
    setDeleteId(null); fetchAccounts()
  }

  const gameIcon = game.image_url
    ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
    : <span className="text-white font-bold text-sm">{game.name.charAt(0).toUpperCase()}</span>

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex-shrink-0">
          <ArrowLeft size={22} />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: game.image_url ? 'transparent' : game.color }}
        >
          {gameIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{game.name}</h1>
        </div>
        <button
          onClick={() => setShowTasks(true)}
          className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          <Settings size={15} />
          Manage Daily
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Accounts</h2>
        <button onClick={openAdd} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ color: game.color }}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center opacity-30">
            <Camera size={28} />
          </div>
          <p>No accounts yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map(account => (
            <button
              key={account.id}
              onClick={() => onSelect(account)}
              className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 transition-colors text-left group"
            >
              {/* Avatar 1:1 */}
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
                <div className="font-semibold text-base">{account.name}</div>
                {account.description && (
                  <div className="text-xs text-slate-400 mt-0.5 truncate">{account.description}</div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span onClick={(e) => openEdit(e, account)} className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                  <Pencil size={15} />
                </span>
                <span onClick={(e) => { e.stopPropagation(); setDeleteId(account.id) }} className="p-2 rounded-lg hover:bg-red-900 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
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
            <h2 className="text-lg font-bold mb-5">{editAccount ? 'Edit Account' : 'Add New Account'}</h2>

            {/* Avatar upload */}
            <div className="flex justify-center mb-5">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current.click()} className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-700 border-2 border-slate-600 group-hover:border-indigo-500 transition-colors">
                  {imageUrl
                    ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    : <Camera size={28} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  }
                </div>
                <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1">
                  <Pencil size={10} className="text-white" />
                </div>
              </button>
            </div>
            {imageUrl && (
              <button onClick={() => setImageUrl('')} className="w-full text-xs text-red-400 text-center mb-3 hover:text-red-300">
                Remove image
              </button>
            )}

            <input
              type="text"
              placeholder="Account name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-3"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-4 resize-none text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !name.trim()} className="flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 text-white" style={{ backgroundColor: game.color }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2">Delete this account?</h2>
            <p className="text-slate-400 text-sm mb-6">All daily history will be deleted too.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={deleteAccount} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showTasks && <ManageTasksModal game={game} onClose={() => setShowTasks(false)} />}
    </div>
  )
}
