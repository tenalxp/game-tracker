import { useRef } from 'react'
import { Move } from 'lucide-react'

export default function ImagePositioner({ src, position = '50% 50%', onChange, shape = 'circle', size = 96 }) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const cur = useRef({ x: 50, y: 50 })
  const imgRef = useRef()

  function parsePos(p) {
    const parts = (p || '50% 50%').split(' ')
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 }
  }

  function onStart(cx, cy) {
    cur.current = parsePos(position)
    dragging.current = true
    last.current = { x: cx, y: cy }
  }

  function onMove(cx, cy) {
    if (!dragging.current) return
    const dx = cx - last.current.x
    const dy = cy - last.current.y
    last.current = { x: cx, y: cy }
    const nx = Math.round(Math.min(100, Math.max(0, cur.current.x - dx * 0.5)))
    const ny = Math.round(Math.min(100, Math.max(0, cur.current.y - dy * 0.5)))
    cur.current = { x: nx, y: ny }
    if (imgRef.current) imgRef.current.style.objectPosition = `${nx}% ${ny}%`
    onChange(`${nx}% ${ny}%`)
  }

  function onEnd() { dragging.current = false }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden border-2 border-dashed border-indigo-500"
        style={{ width: size, height: size, borderRadius: shape === 'circle' ? '50%' : '12px' }}
        onMouseDown={e => { e.preventDefault(); onStart(e.clientX, e.clientY) }}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEnd={onEnd}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: position }}
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Move size={18} className="text-white opacity-40 drop-shadow-lg" />
        </div>
      </div>
      <p className="text-xs text-slate-500">Drag to reposition</p>
    </div>
  )
}
