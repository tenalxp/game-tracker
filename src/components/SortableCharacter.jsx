import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableCharacter({ char }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: char.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <img
        src={char.image_url}
        alt={char.name || ''}
        className="w-12 h-12 rounded-xl object-cover select-none"
        style={{ objectPosition: char.image_position || '50% 50%' }}
        draggable={false}
      />
    </div>
  )
}
