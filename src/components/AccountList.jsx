import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Plus, Camera, Settings2, BookImage, X, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ManageAccountsModal from './ManageAccountsModal'
import CharacterLibraryModal from './CharacterLibraryModal'
import DraggableImage from './DraggableImage'
import { CharImagePicker } from './ResourcesSection'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getGameDayForHour } from '../lib/dateUtils'

function fmt(n) {
  if (n == null || n === '') return '0'
  return Number(n).toLocaleString()
}

function SortableInlineResource({ item, game, gameColor, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center gap-0.5">
      <div {...attributes} {...listeners} className="w-full flex justify-center cursor-grab active:cursor-grabbing touch-none pb-0.5">
        <svg width="14" height="6" viewBox="0 0 14 6" fill="currentColor" className="text-slate-700">
          <circle cx="3" cy="1.5" r="1.2"/><circle cx="7" cy="1.5" r="1.2"/><circle cx="11" cy="1.5" r="1.2"/>
          <circle cx="3" cy="4.5" r="1.2"/><circle cx="7" cy="4.5" r="1.2"/><circle cx="11" cy="4.5" r="1.2"/>
        </svg>
      </div>
      <InlineResource item={item} game={game} gameColor={gameColor} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  )
}

function InlineResource({ item, game, gameColor, onUpdate, onDelete }) {
  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState(String(item.quantity ?? 0))
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(item.name || '')
  const [showPicker, setShowPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const longPressTimer = useRef(null)

  function handleTouchStart(e) {
    longPressTimer.current = setTimeout(() => { e.stopPropagation(); setShowDelete(true) }, 600)
  }
  function handleTouchEnd() { clearTimeout(longPressTimer.current) }

  async function saveName() {
    const name = nameInput.trim() || item.name
    setEditingName(false)
    setNameInput(name)
    await supabase.from('account_resources').update({ name }).eq('id', item.id)
    onUpdate({ ...item, name })
  }

  async function saveQty() {
    const val = parseInt(qtyInput.replace(/,/g, ''), 10)
    const qty = isNaN(val) ? 0 : val
    setEditingQty(false)
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
      <div
        className="relative group/res flex flex-col items-center gap-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <button
          onClick={e => { e.stopPropagation(); setShowDelete(false); setConfirmDelete(true) }}
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 items-center justify-center z-10 transition-opacity ${showDelete ? 'flex' : 'hidden group-hover/res:flex'}`}
        >
          <X size={8} className="text-white" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); setShowPicker(true) }}
          className="relative w-11 h-11 rounded-xl bg-white/8 overflow-hidden flex items-center justify-center"
        >
          {item.image_url
            ? <img src={item.image_url} alt="" className="w-full h-full object-cover"
                style={{ objectPosition: item.image_position || '50% 50%' }} />
            : <ImageIcon size={16} className="text-slate-500" />
          }
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/res:opacity-100 flex items-center justify-center transition-opacity">
            <ImageIcon size={11} className="text-white" />
          </div>
        </button>
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={e => { e.stopPropagation(); saveName() }}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameInput(item.name || '') } }}
            onClick={e => e.stopPropagation()}
            className="w-16 text-center text-[10px] bg-white/10 rounded px-1 py-0.5 outline-none border border-indigo-400 text-white"
          />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setEditingName(true); setNameInput(item.name || '') }}
            className="text-[10px] text-slate-400 hover:text-white text-center leading-tight truncate w-11 transition-colors"
          >
            {item.name || <span className="opacity-40">name</span>}
          </button>
        )}
        {editingQty ? (
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={qtyInput}
            onChange={e => setQtyInput(e.target.value)}
            onBlur={e => { e.stopPropagation(); saveQty() }}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveQty() }}
            onClick={e => e.stopPropagation()}
            className="w-11 text-center text-xs font-semibold bg-white/10 rounded px-1 py-0.5 outline-none border border-indigo-400"
            style={{ color: gameColor }}
          />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setEditingQty(true); setQtyInput(String(item.quantity ?? 0)) }}
            className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
          >
            {fmt(item.quantity)}
          </button>
        )}
      </div>
      {showPicker && <CharImagePicker game={game} onPick={pickImage} onClose={() => setShowPicker(false)} />}
      {confirmDelete && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.stopPropagation()}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xs p-6">
            <h2 className="text-base font-bold mb-1">Delete this resource?</h2>
            <p className="text-slate-400 text-sm mb-5">"{item.name || 'Item'}"</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-white/8 hover:bg-white/10 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => { setConfirmDelete(false); onDelete() }} className="flex-1 bg-red-600 hover:bg-red-500 py-2.5 rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export const PASTEL_COLORS = [
  '#ffb3ba', '#ff8fa3', '#ff6b8a', '#ff4d6d',
  '#ffd4b3', '#ffba8a', '#ff9f5b', '#ff8533',
  '#fff4b3', '#ffe566', '#ffd700', '#f5c400',
  '#b3f0c8', '#7de8a4', '#4dd980', '#2ecc71',
  '#b3d9ff', '#7abfff', '#4da6ff', '#1a8cff',
  '#d4b3ff', '#b57bee', '#9b59b6', '#8e44ad',
  '#ffb3e6', '#ff80d5', '#ff4dc4', '#e91ea8',
  '#b3ffe6', '#66ffcc', '#00ffb3', '#00e6a0',
  '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080',
]

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${!value ? 'border-indigo-400 scale-110' : 'border-slate-600 hover:border-slate-400'} bg-white/8`}
      >
        <X size={12} className="text-slate-400" />
      </button>
      {PASTEL_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function fmtDate(val) {
  if (!val) return ''
  const [y, m, d] = val.split('-')
  return `${parseInt(d)}/${parseInt(m)}/${y}`
}

function waitBadge(noteDate) {
  if (!noteDate) return null
  const purchase = new Date(noteDate)
  const purchaseDay = new Date(purchase.getFullYear(), purchase.getMonth(), purchase.getDate())
  const now = new Date()
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.floor((todayDay - purchaseDay) / 86400000)
  const day = diff + 1
  if (day >= 7) return { label: '✓ Ready', color: '#16a34a', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' }
  if (day >= 6) return { label: `Day ${day}/7`, color: '#ea580c', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)' }
  return { label: `Day ${day}/7`, color: '#ca8a04', bg: 'rgba(234,179,8,0.18)', border: 'rgba(234,179,8,0.35)' }
}

function SortableAccountRow({ account, game, characters, resources, events, onResourcesChange, onEventsChange, activeId, setActiveId, onDateChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id })
  const addingResource = activeId === account.id + ':chars_weapons' || activeId === account.id + ':currency'
  const addingCategory = activeId === account.id + ':chars_weapons' ? 'chars_weapons' : activeId === account.id + ':currency' ? 'currency' : null
  const [newResName, setNewResName] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState(account.note_date || '')
  const [editingDate2, setEditingDate2] = useState(false)
  const [dateInput2, setDateInput2] = useState(account.note_date2 || '')
  const [showInfo, setShowInfo] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(account.name || '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descInput, setDescInput] = useState(account.description || '')
  const [editingLevel, setEditingLevel] = useState(false)
  const [levelInput, setLevelInput] = useState(account.level || '')
  const [editingUid, setEditingUid] = useState(false)
  const [uidInput, setUidInput] = useState(account.uid || '')
  const [editingRegion, setEditingRegion] = useState(false)
  const [regionInput, setRegionInput] = useState(account.region || '')
  const [editingBuy, setEditingBuy] = useState(false)
  const [buyInput, setBuyInput] = useState(account.price_buy != null ? String(account.price_buy) : '')
  const [editingSell, setEditingSell] = useState(false)
  const [sellInput, setSellInput] = useState(account.price_sell != null ? String(account.price_sell) : '')
  const avatarFileRef = useRef()
  const [avatarUrl, setAvatarUrl] = useState(account.image_url || '')
  const [newEventName, setNewEventName] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)
  const accountEvents = events[account.id] || []
  const resSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }))
  const [dqResetHour, setDqResetHour] = useState(account.daily_quest_reset_hour ?? 3)
  const [dqLastDoneDay, setDqLastDoneDay] = useState(account.daily_quest_last_done_day || null)
  const [editingDqHour, setEditingDqHour] = useState(false)
  const [dqHourInput, setDqHourInput] = useState(String(account.daily_quest_reset_hour ?? 3))

  async function handleAvatarFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const url = ev.target.result
      setAvatarUrl(url)
      await supabase.from('game_accounts').update({ image_url: url, image_position: '50% 50%' }).eq('id', account.id)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function openAdd(e, category = 'operator') { e.stopPropagation(); setActiveId(account.id + ':' + category); setNewResName('') }
  function closeAdd() { setActiveId(null); setNewResName('') }

  const isDqDone = dqLastDoneDay === getGameDayForHour(dqResetHour)

  async function toggleDailyQuest(e) {
    e.stopPropagation()
    const today = getGameDayForHour(dqResetHour)
    const newDay = isDqDone ? null : today
    setDqLastDoneDay(newDay)
    await supabase.from('game_accounts').update({ daily_quest_last_done_day: newDay }).eq('id', account.id)
  }

  async function saveDqHour(val) {
    const h = Math.min(23, Math.max(0, parseInt(val) || 0))
    setDqResetHour(h)
    setDqHourInput(String(h))
    setEditingDqHour(false)
    await supabase.from('game_accounts').update({ daily_quest_reset_hour: h }).eq('id', account.id)
  }

  async function saveDate(val) {
    setEditingDate(false)
    setDateInput(val)
    await supabase.from('game_accounts').update({ note_date: val || null }).eq('id', account.id)
    onDateChange(account.id, 'note_date', val || null)
  }

  function isEventDone(ev) {
    const resetDays = ev.reset_days ?? 0
    if (resetDays === 0) return ev.done
    const today = getGameDayForHour(ev.reset_hour ?? 3)
    return ev.last_done_day === today
  }

  async function toggleEvent(ev) {
    const resetDays = ev.reset_days ?? 0
    let updated
    if (resetDays === 0) {
      updated = { ...ev, done: !ev.done }
      await supabase.from('account_events').update({ done: updated.done }).eq('id', ev.id)
    } else {
      const today = getGameDayForHour(ev.reset_hour ?? 3)
      const isDone = ev.last_done_day === today
      const newDay = isDone ? null : today
      updated = { ...ev, last_done_day: newDay }
      await supabase.from('account_events').update({ last_done_day: newDay }).eq('id', ev.id)
    }
    onEventsChange(account.id, accountEvents.map(e => e.id === ev.id ? updated : e))
  }

  async function toggleEventReset(ev) {
    const newDays = (ev.reset_days ?? 0) > 0 ? 0 : 1
    const updated = { ...ev, reset_days: newDays }
    await supabase.from('account_events').update({ reset_days: newDays }).eq('id', ev.id)
    onEventsChange(account.id, accountEvents.map(e => e.id === ev.id ? updated : e))
  }

  async function addEvent(e) {
    e.stopPropagation()
    if (!newEventName.trim()) return
    const { data } = await supabase.from('account_events').insert({
      account_id: account.id,
      name: newEventName.trim(),
      done: false,
      sort_order: accountEvents.length,
    }).select().single()
    if (data) onEventsChange(account.id, [...accountEvents, data])
    setNewEventName('')
    setAddingEvent(false)
  }

  async function deleteEvent(ev) {
    await supabase.from('account_events').delete().eq('id', ev.id)
    onEventsChange(account.id, accountEvents.filter(e => e.id !== ev.id))
  }

  async function saveDesc(val) {
    setEditingDesc(false)
    setDescInput(val)
    await supabase.from('game_accounts').update({ description: val.trim() || null }).eq('id', account.id)
  }

  async function saveName(val) {
    setEditingName(false)
    const name = val.trim() || account.name
    setNameInput(name)
    await supabase.from('game_accounts').update({ name }).eq('id', account.id)
  }

  async function saveBuy(val) {
    setEditingBuy(false)
    const num = val.trim().replace(/,/g, '')
    setBuyInput(num)
    await supabase.from('game_accounts').update({ price_buy: num === '' ? null : Number(num) }).eq('id', account.id)
  }

  async function saveSell(val) {
    setEditingSell(false)
    const num = val.trim().replace(/,/g, '')
    setSellInput(num)
    await supabase.from('game_accounts').update({ price_sell: num === '' ? null : Number(num) }).eq('id', account.id)
  }

  async function saveLevel(val) {
    setEditingLevel(false)
    setLevelInput(val)
    await supabase.from('game_accounts').update({ level: val.trim() || null }).eq('id', account.id)
  }

  async function saveUid(val) {
    setEditingUid(false)
    setUidInput(val)
    await supabase.from('game_accounts').update({ uid: val.trim() || null }).eq('id', account.id)
  }

  async function saveRegion(val) {
    setEditingRegion(false)
    setRegionInput(val)
    await supabase.from('game_accounts').update({ region: val.trim() || null }).eq('id', account.id)
  }

  async function saveDate2(val) {
    setEditingDate2(false)
    setDateInput2(val)
    await supabase.from('game_accounts').update({ note_date2: val || null }).eq('id', account.id)
    onDateChange(account.id, 'note_date2', val || null)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const accountResources = resources[account.id] || []
  const charsWeaponsResources = accountResources.filter(r => (r.category || 'chars_weapons') !== 'currency')
  const currencyResources = accountResources.filter(r => r.category === 'currency')

  async function addResource(e, category = 'chars_weapons') {
    e.stopPropagation()
    const { data } = await supabase.from('account_resources').insert({
      account_id: account.id,
      name: newResName.trim(),
      quantity: 0,
      category,
      sort_order: accountResources.length,
    }).select().single()
    if (data) onResourcesChange(account.id, [...accountResources, data])
    closeAdd()
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 touch-none"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
        </svg>
      </div>

      <div
        className="flex-1 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: account.color ? account.color + '22' : 'rgba(255,255,255,0.04)',
          borderLeft: account.color ? `4px solid ${account.color}` : '4px solid transparent',
        }}
      >
        <div className="w-full flex items-center gap-4 p-4 text-left"
        >
          <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleAvatarFile} className="hidden" />
          <button
            onClick={e => { e.stopPropagation(); avatarFileRef.current.click() }}
            className="relative group/avatar w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: avatarUrl ? 'transparent' : game.color + '33', border: `2px solid ${account.color || game.color}` }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={account.name} className="w-full h-full object-cover" style={{ objectPosition: account.image_position || '50% 50%' }} />
              : <span style={{ color: account.color || game.color }}>{account.name.charAt(0).toUpperCase()}</span>
            }
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-full">
              <Camera size={16} className="text-white" />
            </div>
          </button>
          <div className="flex-1 min-w-0 flex gap-2">
            {/* Left: name / desc / chars */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {editingName ? (
                  <input autoFocus type="text" value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onBlur={e => { e.stopPropagation(); saveName(e.target.value) }}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveName(nameInput); if (e.key === 'Escape') { setEditingName(false); setNameInput(account.name) } }}
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-base bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-40"
                  />
                ) : (
                  <div
                    className="font-semibold text-base truncate cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={e => { e.stopPropagation(); setEditingName(true) }}
                  >{nameInput}</div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setShowInfo(v => !v) }}
                  className="flex-shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showInfo ? <polyline points="18,15 12,9 6,15"/> : <polyline points="6,9 12,15 18,9"/>}
                  </svg>
                </button>
                {editingLevel ? (
                  <input autoFocus type="text" value={levelInput}
                    onChange={e => setLevelInput(e.target.value)}
                    onBlur={e => { e.stopPropagation(); saveLevel(e.target.value) }}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveLevel(levelInput); if (e.key === 'Escape') { setEditingLevel(false); setLevelInput(account.level || '') } }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-16"
                    placeholder="Lv."
                  />
                ) : (
                  <button onClick={e => { e.stopPropagation(); setEditingLevel(true) }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0">
                    {levelInput ? `Lv.${levelInput}` : <span className="opacity-40">+ Lv.</span>}
                  </button>
                )}
                {editingDate ? (
                  <input autoFocus type="date" value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    onBlur={e => { e.stopPropagation(); saveDate(e.target.value) }}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveDate(dateInput); if (e.key === 'Escape') setEditingDate(false) }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white"
                  />
                ) : (
                  <button onClick={e => { e.stopPropagation(); setEditingDate(true) }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                    {dateInput ? fmtDate(dateInput) : <span className="opacity-40">+ date</span>}
                  </button>
                )}
                {editingDate2 ? (
                  <input autoFocus type="date" value={dateInput2}
                    onChange={e => setDateInput2(e.target.value)}
                    onBlur={e => { e.stopPropagation(); saveDate2(e.target.value) }}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveDate2(dateInput2); if (e.key === 'Escape') setEditingDate2(false) }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white"
                  />
                ) : (
                  <button onClick={e => { e.stopPropagation(); setEditingDate2(true) }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                    {dateInput2 ? fmtDate(dateInput2) : <span className="opacity-40">+ date</span>}
                  </button>
                )}
              </div>
              {showInfo && (<>
              {editingDesc ? (
                <input autoFocus type="text" value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  onBlur={e => { e.stopPropagation(); saveDesc(e.target.value) }}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveDesc(descInput); if (e.key === 'Escape') { setEditingDesc(false); setDescInput(account.description || '') } }}
                  onClick={e => e.stopPropagation()}
                  className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-48"
                  placeholder="Description..."
                />
              ) : (
                <div onClick={e => { e.stopPropagation(); setEditingDesc(true) }}
                  className="text-xs text-slate-400 mt-0.5 truncate cursor-pointer hover:text-slate-300 transition-colors">
                  {descInput || <span className="opacity-40">+ description</span>}
                </div>
              )}
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {/* Buy price */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-300 font-medium">Buy</span>
                  {editingBuy ? (
                    <input autoFocus type="text" inputMode="numeric" value={buyInput}
                      onChange={e => setBuyInput(e.target.value)}
                      onBlur={e => { e.stopPropagation(); saveBuy(e.target.value) }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveBuy(buyInput); if (e.key === 'Escape') { setEditingBuy(false); setBuyInput(account.price_buy != null ? String(account.price_buy) : '') } }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-24"
                      placeholder="0"
                    />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setEditingBuy(true) }}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                      {buyInput !== '' ? `฿${Number(buyInput).toLocaleString()}` : <span className="opacity-40">+ price</span>}
                    </button>
                  )}
                </div>
                {/* Sell price */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-300 font-medium">Sell</span>
                  {editingSell ? (
                    <input autoFocus type="text" inputMode="numeric" value={sellInput}
                      onChange={e => setSellInput(e.target.value)}
                      onBlur={e => { e.stopPropagation(); saveSell(e.target.value) }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveSell(sellInput); if (e.key === 'Escape') { setEditingSell(false); setSellInput(account.price_sell != null ? String(account.price_sell) : '') } }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-24"
                      placeholder="0"
                    />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setEditingSell(true) }}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                      {sellInput !== '' ? `฿${Number(sellInput).toLocaleString()}` : <span className="opacity-40">+ price</span>}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wide">UID</span>
                  {editingUid ? (
                    <input autoFocus type="text" value={uidInput}
                      onChange={e => setUidInput(e.target.value)}
                      onBlur={e => { e.stopPropagation(); saveUid(e.target.value) }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveUid(uidInput); if (e.key === 'Escape') { setEditingUid(false); setUidInput(account.uid || '') } }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-28"
                      placeholder="UID..."
                    />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setEditingUid(true) }}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                      {uidInput || <span className="opacity-40">+ UID</span>}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wide">Region</span>
                  {editingRegion ? (
                    <input autoFocus type="text" value={regionInput}
                      onChange={e => setRegionInput(e.target.value)}
                      onBlur={e => { e.stopPropagation(); saveRegion(e.target.value) }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') saveRegion(regionInput); if (e.key === 'Escape') { setEditingRegion(false); setRegionInput(account.region || '') } }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs bg-white/10 rounded-lg px-2 py-0.5 outline-none border border-indigo-400 text-white w-24"
                      placeholder="Region..."
                    />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setEditingRegion(true) }}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                      {regionInput || <span className="opacity-40">+ Region</span>}
                    </button>
                  )}
                </div>
              </div>
              </>)}
              {(characters[account.id] || []).length > 0 && (() => {
                const chars = characters[account.id] || []
                const maxShow = 10
                const shown = chars.slice(0, maxShow)
                const extra = chars.length - maxShow
                return (
                  <div className="grid grid-cols-5 gap-1 mt-2" style={{ width: 'fit-content' }}>
                    {shown.map(char => (
                      <img key={char.id} src={char.image_url} alt="" className="w-9 h-9 rounded-lg object-cover" style={{ objectPosition: char.image_position || '50% 50%' }} />
                    ))}
                    {extra > 0 && (
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xs text-slate-400 font-medium">
                        +{extra}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Right: Daily Quest + Wait badge */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1 justify-start">
              {(() => {
                const badge = waitBadge(dateInput)
                if (!badge) return null
                return (
                  <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', backgroundColor: badge.bg, color: badge.color, border: `0.5px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                )
              })()}
              <button
                onClick={toggleDailyQuest}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${isDqDone ? 'text-white' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                style={isDqDone ? { backgroundColor: '#16a34acc' } : {}}
              >
                {isDqDone
                  ? <><svg width="12" height="12" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> Daily Quest</>
                  : <><div className="w-2 h-2 rounded-full border border-slate-500" /> Daily Quest</>
                }
              </button>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-slate-600">Resets</span>
                {editingDqHour ? (
                  <input autoFocus type="number" min={0} max={23} value={dqHourInput}
                    onChange={e => setDqHourInput(e.target.value)}
                    onBlur={e => saveDqHour(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDqHour(dqHourInput); if (e.key === 'Escape') setEditingDqHour(false) }}
                    className="w-10 bg-white/10 rounded px-1 py-0.5 text-[10px] text-white outline-none border border-indigo-400 text-center"
                  />
                ) : (
                  <button onClick={() => setEditingDqHour(true)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                    {String(dqResetHour).padStart(2, '0')}:00
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resources — 2 sections */}
        {(['chars_weapons', 'currency']).map(cat => {
          const catItems = cat === 'chars_weapons' ? charsWeaponsResources : currencyResources
          const isAdding = addingCategory === cat
          return (
            <div key={cat} className="px-4 pb-2 border-t border-white/5 pt-2">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{cat === 'chars_weapons' ? 'Characters & Weapons' : 'Currency'}</span>
              </div>
              <DndContext
                sensors={resSensors}
                collisionDetection={closestCenter}
                onDragEnd={async ({ active, over }) => {
                  if (!over || active.id === over.id) return
                  const oldIdx = catItems.findIndex(r => r.id === active.id)
                  const newIdx = catItems.findIndex(r => r.id === over.id)
                  const reordered = arrayMove(catItems, oldIdx, newIdx)
                  const otherItems = accountResources.filter(r => (r.category || 'chars_weapons') !== cat && !(cat === 'chars_weapons' && r.category !== 'currency'))
                  onResourcesChange(account.id, [...accountResources.filter(r => !catItems.find(c => c.id === r.id)), ...reordered])
                  await Promise.all(reordered.map((r, i) => supabase.from('account_resources').update({ sort_order: i }).eq('id', r.id)))
                }}
              >
                <SortableContext items={catItems.map(r => r.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex items-start gap-2 flex-wrap">
                    {catItems.map(item => (
                      <SortableInlineResource
                        key={item.id}
                        item={item}
                        game={game}
                        gameColor={game.color}
                        onUpdate={updated => onResourcesChange(account.id, accountResources.map(r => r.id === updated.id ? updated : r))}
                        onDelete={async () => {
                          await supabase.from('account_resources').delete().eq('id', item.id)
                          onResourcesChange(account.id, accountResources.filter(r => r.id !== item.id))
                        }}
                      />
                    ))}
                {isAdding ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Name"
                      value={newResName}
                      onChange={e => setNewResName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addResource(e, cat); if (e.key === 'Escape') { e.stopPropagation(); closeAdd() } }}
                      className="w-24 bg-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 outline-none border border-indigo-400"
                    />
                    <button onClick={e => addResource(e, cat)} className="text-xs px-2 py-1 rounded-lg text-white font-medium" style={{ backgroundColor: game.color }}>Add</button>
                    <button onClick={e => { e.stopPropagation(); closeAdd() }} className="text-xs px-2 py-1 rounded-lg bg-white/8 text-slate-400">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={e => openAdd(e, cat)}
                    className="w-11 h-11 rounded-xl border border-dashed border-white/15 hover:border-indigo-400 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )
        })}

        {/* Events section */}
        {(accountEvents.length > 0 || addingEvent) && (
          <div className="px-4 pb-3 border-t border-white/5 pt-2 space-y-1">
            {accountEvents.map(ev => {
              const done = isEventDone(ev)
              const hasReset = (ev.reset_days ?? 0) > 0
              return (
                <div key={ev.id} className="flex items-center gap-2 group/ev">
                    <button onClick={e => { e.stopPropagation(); toggleEvent(ev) }} className="flex-shrink-0">
                      {done
                        ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: game.color }}><svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                        : <div className="w-4 h-4 rounded-full border-2 border-slate-500" />
                      }
                    </button>
                    <span onClick={e => { e.stopPropagation(); toggleEvent(ev) }} className={`flex-1 text-xs cursor-pointer ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                      {ev.name}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteEvent(ev) }}
                      className="opacity-0 group-hover/ev:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <X size={12} />
                    </button>
                </div>
              )
            })}
            {addingEvent && (
              <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                <Plus size={12} className="text-slate-500 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Event name..."
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addEvent(e); if (e.key === 'Escape') { e.stopPropagation(); setAddingEvent(false) } }}
                  className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 outline-none border border-indigo-400"
                />
                <button onClick={addEvent} className="text-xs px-2 py-1 rounded-lg text-white font-medium" style={{ backgroundColor: game.color }}>Add</button>
                <button onClick={e => { e.stopPropagation(); setAddingEvent(false) }} className="text-xs text-slate-400">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Add event button */}
        <div className="px-4 pb-3">
          <button
            onClick={e => { e.stopPropagation(); setAddingEvent(true) }}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Plus size={11} /> Add event
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AccountList({ game, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [characters, setCharacters] = useState({})
  const [resources, setResources] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePos, setImagePos] = useState('50% 50%')
  const [color, setColor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeResourceId, setActiveResourceId] = useState(null)
  const [events, setEvents] = useState({})
  const fileRef = useRef()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  useEffect(() => { fetchAccounts() }, [game.id])

  async function fetchAccounts() {
    const { data } = await supabase
      .from('game_accounts').select('*').eq('game_id', game.id)
      .order('created_at')
    const sorted = (data || []).sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
    setAccounts(sorted)
    if (sorted.length) {
      const { data: chars } = await supabase
        .from('account_characters')
        .select('account_id, sort_order, characters(id, image_url, name, image_position)')
        .in('account_id', sorted.map(a => a.id))
      const sortedChars = (chars || []).sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
      const map = {}
      for (const row of sortedChars) {
        if (!map[row.account_id]) map[row.account_id] = []
        if (row.characters) map[row.account_id].push(row.characters)
      }
      setCharacters(map)

      const { data: res } = await supabase
        .from('account_resources')
        .select('*')
        .in('account_id', sorted.map(a => a.id))
        .order('sort_order')
      const resMap = {}
      for (const r of (res || [])) {
        if (!resMap[r.account_id]) resMap[r.account_id] = []
        resMap[r.account_id].push(r)
      }
      setResources(resMap)

      const { data: evData } = await supabase
        .from('account_events')
        .select('*')
        .in('account_id', sorted.map(a => a.id))
        .order('sort_order')
      const evMap = {}
      for (const ev of (evData || [])) {
        if (!evMap[ev.account_id]) evMap[ev.account_id] = []
        evMap[ev.account_id].push(ev)
      }
      setEvents(evMap)
    }
    setLoading(false)
  }


  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = accounts.findIndex(a => a.id === active.id)
    const newIndex = accounts.findIndex(a => a.id === over.id)
    const newOrder = arrayMove(accounts, oldIndex, newIndex)
    setAccounts(newOrder)
    await Promise.all(newOrder.map((acc, idx) =>
      supabase.from('game_accounts').update({ sort_order: idx }).eq('id', acc.id)
    ))
  }

  function openAdd() {
    setName(''); setDescription(''); setImageUrl(''); setImagePos('50% 50%'); setColor(null)
    setShowAdd(true)
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
    setImagePos('50% 50%')
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('game_accounts').insert({
      game_id: game.id,
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      image_position: imagePos,
      color: color || null,
      sort_order: accounts.length,
    })
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    fetchAccounts()
  }

  const gameIcon = game.image_url
    ? <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" style={{ objectPosition: game.image_position || '50% 50%' }} />
    : <span className="text-white font-bold text-sm">{game.name.charAt(0).toUpperCase()}</span>

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 backdrop-blur-sm transition-colors text-slate-400 hover:text-white flex-shrink-0">
          <ArrowLeft size={22} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: game.image_url ? 'transparent' : game.color }}>
          {gameIcon}
        </div>
        <h1 className="text-2xl font-bold flex-1 truncate">{game.name}</h1>
        <button onClick={() => setShowLibrary(true)} className="p-2 text-slate-400 hover:text-white bg-white/5 backdrop-blur-sm hover:bg-white/8 rounded-lg transition-colors flex-shrink-0">
          <BookImage size={18} />
        </button>
        <button onClick={() => setShowManage(true)} className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-white/5 backdrop-blur-sm hover:bg-white/8 px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0">
          <Settings2 size={15} /> Manage
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Accounts</h2>
        <button onClick={openAdd} className="flex items-center gap-1 bg-white/5 backdrop-blur-sm hover:bg-white/8 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ color: game.color }}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-10">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center opacity-30">
            <Camera size={28} />
          </div>
          <p>No accounts yet.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={accounts.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {accounts.map(account => (
                <SortableAccountRow
                  key={account.id}
                  account={account}
                  game={game}
                  characters={characters}
                  resources={resources}
                  events={events}
                  onResourcesChange={(accountId, updated) =>
                    setResources(prev => ({ ...prev, [accountId]: updated }))
                  }
                  onEventsChange={(accountId, updated) =>
                    setEvents(prev => ({ ...prev, [accountId]: updated }))
                  }
                  activeId={activeResourceId}
                  setActiveId={setActiveResourceId}
                  onDateChange={(id, field, val) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-5">Add New Account</h2>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            <div className="flex justify-center mb-4">
              {imageUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <DraggableImage src={imageUrl} position={imagePos} onPositionChange={setImagePos} divClassName="w-20 h-20 rounded-full border-2 border-dashed border-indigo-500" />
                  <div className="flex gap-4">
                    <button onClick={() => fileRef.current.click()} className="text-xs text-indigo-400 hover:text-indigo-300">Change photo</button>
                    <button onClick={() => { setImageUrl(''); setImagePos('50% 50%') }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current.click()} className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white/8 border-2 border-slate-600 group-hover:border-indigo-500 transition-colors">
                    <Camera size={28} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5"><Plus size={10} className="text-white" /></div>
                </button>
              )}
            </div>
            <input type="text" placeholder="Account name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus className="w-full bg-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-3" />
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 mb-3 resize-none text-sm" />
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Background color</p>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-white/8 hover:bg-slate-600 py-3 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !name.trim()} className="flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 text-white" style={{ backgroundColor: game.color }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManage && <ManageAccountsModal game={game} accounts={accounts} onClose={() => { setShowManage(false); fetchAccounts() }} onRefresh={fetchAccounts} />}
      {showLibrary && <CharacterLibraryModal game={game} onClose={() => { setShowLibrary(false); fetchAccounts() }} />}
    </div>
  )
}
