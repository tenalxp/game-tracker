import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

function fmt(n) {
  if (n == null || n === '') return '0'
  return Number(n).toLocaleString()
}

// Modal: pick image from Character Library
export function CharImagePicker({ game, onPick, onClose }) {
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('characters').select('*').eq('game_id', game.id).order('sort_order')
      .then(({ data }) => { setChars(data || []); setLoading(false) })
  }, [game.id])

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm flex flex-col max-h-[75vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="font-bold text-base">Pick from Library</h2>
            <p className="text-slate-400 text-xs">{game.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-slate-400 text-center py-8 text-sm">Loading...</div>
          ) : chars.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">No characters in library yet</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {chars.map(char => (
                <button
                  key={char.id}
                  onClick={() => onPick(char.image_url, char.image_position)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition-all">
                    <img
                      src={char.image_url}
                      alt={char.name || ''}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: char.image_position || '50% 50%' }}
                    />
                  </div>
                  {char.name && (
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 truncate w-full text-center">{char.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ResourceCard({ item, game, gameColor, onUpdate, onDelete }) {
  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState(String(item.quantity ?? 0))
  const [showPicker, setShowPicker] = useState(false)

  async function saveQty() {
    const val = parseInt(qtyInput.replace(/,/g, ''), 10)
    const qty = isNaN(val) ? 0 : val
    setEditingQty(false)
    setQtyInput(String(qty))
    await supabase.from('account_resources').update({ quantity: qty }).eq('id', item.id)
    onUpdate({ ...item, quantity: qty })
  }

  async function pickImage(imageUrl, imagePosition) {
    setShowPicker(false)
    await supabase.from('account_resources').update({ image_url: imageUrl }).eq('id', item.id)
    onUpdate({ ...item, image_url: imageUrl, image_position: imagePosition || '50% 50%' })
  }

  return (
    <>
      <div className="relative group bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col items-center gap-2">
        {/* Image — tap to pick from library */}
        <button
          onClick={() => setShowPicker(true)}
          className="relative w-14 h-14 rounded-xl bg-white/8 overflow-hidden flex items-center justify-center transition-all"
        >
          {item.image_url
            ? <img src={item.image_url} alt="" className="w-full h-full object-cover"
                style={{ objectPosition: item.image_position || '50% 50%' }} />
            : <ImageIcon size={22} className="text-slate-500" />
          }
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
            <ImageIcon size={14} className="text-white" />
          </div>
        </button>

        {/* Name */}
        <div className="text-xs text-slate-400 text-center truncate w-full">{item.name || 'Item'}</div>

        {/* Quantity — tap to edit */}
        {editingQty ? (
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={qtyInput}
            onChange={e => setQtyInput(e.target.value)}
            onBlur={saveQty}
            onKeyDown={e => { if (e.key === 'Enter') saveQty() }}
            className="w-full text-center text-sm font-semibold bg-white/10 rounded-lg px-1 py-0.5 outline-none border border-indigo-400"
            style={{ color: gameColor }}
          />
        ) : (
          <button
            onClick={() => { setEditingQty(true); setQtyInput(String(item.quantity ?? 0)) }}
            className="text-sm font-semibold hover:opacity-70 transition-opacity"
            style={{ color: gameColor }}
          >
            {fmt(item.quantity)}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={10} className="text-white" />
        </button>
      </div>

      {showPicker && (
        <CharImagePicker
          game={game}
          onPick={pickImage}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

export default function ResourcesSection({ account, game, gameColor }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => { fetchItems() }, [account.id])

  async function fetchItems() {
    const { data } = await supabase
      .from('account_resources')
      .select('*')
      .eq('account_id', account.id)
      .order('sort_order')
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!newName.trim()) return
    const { data } = await supabase.from('account_resources').insert({
      account_id: account.id,
      name: newName.trim(),
      quantity: 0,
      sort_order: items.length,
    }).select().single()
    if (data) setItems(prev => [...prev, data])
    setNewName('')
    setAdding(false)
  }

  async function deleteItem(id) {
    await supabase.from('account_resources').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(updated) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  if (loading) return null

  return (
    <div className="mt-6 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Resources</h2>
        <button
          onClick={() => setAdding(true)}
          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            type="text"
            placeholder="Resource name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setAdding(false) }}
            className="flex-1 bg-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none border border-white/10 focus:border-indigo-400"
          />
          <button onClick={addItem} className="px-3 py-2 rounded-xl text-sm text-white font-medium" style={{ backgroundColor: gameColor }}>Add</button>
          <button onClick={() => setAdding(false)} className="px-3 py-2 rounded-xl text-sm bg-white/8 text-slate-400">Cancel</button>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div className="text-center py-6 text-slate-600 text-sm">No resources yet — tap Add</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map(item => (
            <ResourceCard
              key={item.id}
              item={item}
              game={game}
              gameColor={gameColor}
              onUpdate={updateItem}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
