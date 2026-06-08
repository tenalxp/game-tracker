import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableCharacter({ char }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: char.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    touchAction: 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <img
        src={char.image_url}
        alt={char.name || ''}
        className="w-12 h-12 rounded-xl object-cover select-none"
        draggable={false}
      />
    </div>
  )
}
