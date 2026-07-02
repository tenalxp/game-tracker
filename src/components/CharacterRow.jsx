import { useRef, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

export default function CharacterRow({ characters, onPickerOpen, onPositionChange, onReorder }) {
  const containerRef = useRef()
  const draggingRef = useRef(null)
  const displayRef = useRef(characters)
  const onReorderRef = useRef(onReorder)
  const [displayChars, setDisplayChars] = useState(characters)

  useEffect(() => { onReorderRef.current = onReorder }, [onReorder])
  useEffect(() => {
    setDisplayChars(characters)
    displayRef.current = characters
  }, [characters])

  function handleDragStart(e, idx) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = { fromIdx: idx }
  }

  function handleDragMove(e) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const container = containerRef.current
    if (!container || !draggingRef.current) return
    const items = container.querySelectorAll('[data-char]')
    let toIdx = displayRef.current.length - 1
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      if (e.clientX < rect.left + rect.width / 2) {
        toIdx = i
        break
      }
    }
    const fromIdx = draggingRef.current.fromIdx
    if (toIdx !== fromIdx) {
      setDisplayChars(prev => {
        const next = [...prev]
        const [item] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, item)
        displayRef.current = next
        return next
      })
      draggingRef.current.fromIdx = toIdx
    }
  }

  function handleDragEnd(e) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingRef.current = null
    onReorderRef.current(displayRef.current)
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2 flex-wrap">
      {displayChars.map((char, idx) => (
        <div
          key={char.id}
          data-char={idx}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none', userSelect: 'none' }}
          onPointerDown={e => handleDragStart(e, idx)}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <img
            src={char.image_url}
            alt={char.name || ''}
            className="w-12 h-12 rounded-xl object-cover"
            style={{ objectPosition: char.image_position || '50% 50%', pointerEvents: 'none', userSelect: 'none' }}
            draggable={false}
          />
        </div>
      ))}
      <button
        onClick={onPickerOpen}
        className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-400 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
