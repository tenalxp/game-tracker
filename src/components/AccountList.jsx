import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Camera, Settings2, BookImage } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ManageAccountsModal from './ManageAccountsModal'
import CharacterLibraryModal from './CharacterLibraryModal'

export default function AccountList({ game, onSelect, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [characters, setCharacters] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchAccounts() }, [game.id])

  async function fetchAccounts() {
    const { data } = await supabase.from('game_accounts').select('*').eq('game_id', game.id).order('created_at')
    setAccounts(data || [])
    if (data?.length) {
      const { data: chars } = await supabase
        .from('account_characters')
        .select('account_id, characters(id, image_url, name)')
        .in('account_id', data.map(a => a.id))
      const map = {}
      for (const row of (chars || [])) {
        if (!map[row.account_id]) map[row.account_id] = []
        if (row.characters) map[row.account_id].push(row.characters)
      }
      setCharacters(map)
    }
    setLoading(false)
  }

  function openAdd() {
    setName(''); setDescription(''); setImageUrl('')
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
    await supabase.from('game_accounts').insert({
      game_id: game.id,
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
    })
    setSaving(false); setShowAdd(false); fetchAccounts()
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
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: game.image_url ? 'transparent' : game.color }}
        >
          {gameIcon}
        </div>
        <h1 className="text-2xl font-bold flex-1 truncate">{game.name}</h1>
        <button
          onClick={() => setShowLibrary(true)}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          title="Character Library"
        >
          <BookImage size={18} />
        </button>
        <button
          onClick={() => setShowManage(true)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          <Settings2 size={15} />
          Manage
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
              className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 transition-colors text-left"
            >
              <div
                className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl"
                style={{ backgroundColor: account.image_url ? 'transparent' : game.color + '33', border: `2px solid ${game.color}` }}
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
                {/* Character thumbnails */}
                {(characters[account.id] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(characters[account.id] || []).map(char => (
                      <img key={char.id} src={char.image_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-5">Add New Account</h2>

            <div className="flex justify-center mb-5">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current.click()} className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-700 border-2 border-slate-600 group-hover:border-indigo-500 transition-colors">
                  {imageUrl
                    ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    : <Camera size={28} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  }
                </div>
                <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5">
                  <Plus size={10} className="text-white" />
                </div>
              </button>
            </div>
            {imageUrl && (
              <button onClick={() => setImageUrl('')} className="w-full text-xs text-red-400 text-center mb-3 hover:text-red-300">Remove image</button>
            )}

            <input
              type="text" placeholder="Account name" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-3"
            />
            <textarea
              placeholder="Description (optional)" value={description}
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

      {showManage && (
        <ManageAccountsModal
          game={game}
          accounts={accounts}
          onClose={() => { setShowManage(false); fetchAccounts() }}
          onRefresh={fetchAccounts}
        />
      )}
      {showLibrary && (
        <CharacterLibraryModal
          game={game}
          onClose={() => { setShowLibrary(false); fetchAccounts() }}
        />
      )}
    </div>
  )
}
