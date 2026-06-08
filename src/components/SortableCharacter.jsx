import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function SortableCharacter({ char, editing }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: char.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative flex-shrink-0">
      <img
        src={char.image_url}
        alt={char.name || ''}
        className={`w-12 h-12 rounded-xl object-cover select-none ${editing ? 'ring-2 ring-indigo-400' : ''}`}
        draggable={false}
      />
      {editing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} className="text-white" />
        </div>
      )}
    </div>
  )
}
