import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, User, Pencil, Trash2, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ManageTasksModal from './ManageTasksModal'

export default function AccountList({ game, onSelect, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showTasks, setShowTasks] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [game.id])

  async function fetchAccounts() {
    const { data } = await supabase
      .from('game_accounts')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at')
    setAccounts(data || [])
    setLoading(false)
  }

  function openAdd() {
    setName('')
    setEditAccount(null)
    setShowAdd(true)
  }

  function openEdit(e, account) {
    e.stopPropagation()
    setName(account.name)
    setEditAccount(account)
    setShowAdd(true)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    if (editAccount) {
      await supabase.from('game_accounts').update({ name: name.trim() }).eq('id', editAccount.id)
    } else {
      await supabase.from('game_accounts').insert({ game_id: game.id, name: name.trim() })
    }
    setSaving(false)
    setShowAdd(false)
    fetchAccounts()
  }

  async function deleteAccount() {
    await supabase.from('game_accounts').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchAccounts()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: game.color }}
        >
          {game.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-bold flex-1">{game.name}</h1>
        <button
          onClick={() => setShowTasks(true)}
          className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Settings size={15} />
          จัดการ Daily
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Accounts</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: game.color }}
        >
          <Plus size={15} />
          เพิ่ม Account
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10">กำลังโหลด...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มี account</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map(account => (
            <button
              key={account.id}
              onClick={() => onSelect(account)}
              className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-xl p-4 transition-colors text-left group"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: game.color + '33', border: `2px solid ${game.color}` }}
              >
                <span style={{ color: game.color }}>{account.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="flex-1 font-semibold">{account.name}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  onClick={(e) => openEdit(e, account)}
                  className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                >
                  <Pencil size={15} />
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); setDeleteId(account.id) }}
                  className="p-2 rounded-lg hover:bg-red-900 text-slate-400 hover:text-red-400 transition-colors"
                >
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
            <h2 className="text-lg font-bold mb-4">{editAccount ? 'แก้ไข Account' : 'เพิ่ม Account ใหม่'}</h2>
            <input
              type="text"
              placeholder="ชื่อ account"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-4"
              style={{ '--tw-ring-color': game.color }}
            />
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
                className="flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 text-white"
                style={{ backgroundColor: game.color }}
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
            <h2 className="text-lg font-bold mb-2">ลบ Account นี้?</h2>
            <p className="text-slate-400 text-sm mb-6">ประวัติการทำ daily ทั้งหมดจะถูกลบด้วย</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
              <button onClick={deleteAccount} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-medium transition-colors">ลบ</button>
            </div>
          </div>
        </div>
      )}

      {showTasks && (
        <ManageTasksModal game={game} onClose={() => setShowTasks(false)} />
      )}
    </div>
  )
}
