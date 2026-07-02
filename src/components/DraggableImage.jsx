import { useRef } from 'react'

export default function DraggableImage({ src, position = '50% 50%', onPositionChange, divClassName = '', imgClassName = '' }) {
  const cur = useRef({ x: 50, y: 50 })
  const last = useRef({ x: 0, y: 0 })
  const imgRef = useRef()
  const posRef = useRef(position)
  const cbRef = useRef(onPositionChange)
  posRef.current = position
  cbRef.current = onPositionChange

  function parsePos(p) {
    const parts = (p || '50% 50%').split(' ')
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 }
  }

  return (
    <div
      className={`overflow-hidden cursor-grab active:cursor-grabbing ${divClassName}`}
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={e => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        cur.current = parsePos(posRef.current)
        last.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={e => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        const nx = Math.round(Math.min(100, Math.max(0, cur.current.x - dx * 0.5)))
        const ny = Math.round(Math.min(100, Math.max(0, cur.current.y - dy * 0.5)))
        cur.current = { x: nx, y: ny }
        if (imgRef.current) imgRef.current.style.objectPosition = `${nx}% ${ny}%`
      }}
      onPointerUp={e => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        e.currentTarget.releasePointerCapture(e.pointerId)
        cbRef.current?.(`${cur.current.x}% ${cur.current.y}%`)
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        className={`w-full h-full object-cover pointer-events-none ${imgClassName}`}
        style={{ objectPosition: position }}
        draggable={false}
      />
    </div>
  )
}
