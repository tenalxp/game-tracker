import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CharacterLibraryModal({ game, onClose }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchCharacters() }, [])

  async function fetchCharacters() {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('game_id', game.id)
      .order('sort_order')
    setCharacters(data || [])
    setLoading(false)
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `${game.id}/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('characters').upload(path, file, { contentType: file.type })
      if (!error) {
        const { data: urlData } = supabase.storage.from('characters').getPublicUrl(path)
        await supabase.from('characters').insert({
          game_id: game.id,
          image_url: urlData.publicUrl,
          sort_order: characters.length + i,
        })
      }
    }
    e.target.value = ''
    setUploading(false)
    fetchCharacters()
  }

  async function saveName(id) {
    await supabase.from('characters').update({ name: editName.trim() || null }).eq('id', id)
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() || null } : c))
    setEditingId(null)
  }

  async function deleteChar(char) {
    // Delete from storage
    const path = char.image_url.split('/characters/')[1]
    if (path) await supabase.storage.from('characters').remove([path])
    await supabase.from('characters').delete().eq('id', char.id)
    setCharacters(prev => prev.filter(c => c.id !== char.id))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Character Library</h2>
            <p className="text-slate-400 text-sm">{game.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-slate-500 text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {characters.map(char => (
                <div key={char.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-700">
                    <img src={char.image_url} alt={char.name || ''} className="w-full h-full object-cover" />
                  </div>
                  {editingId === char.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName(char.id)}
                        autoFocus
                        placeholder="Name"
                        className="flex-1 bg-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none min-w-0"
                      />
                      <button onClick={() => saveName(char.id)} className="text-green-400 flex-shrink-0">
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(char.id); setEditName(char.name || '') }}
                      className="w-full text-center mt-1 text-xs text-slate-400 hover:text-white truncate flex items-center justify-center gap-1"
                    >
                      {char.name || <span className="opacity-40">add name</span>}
                      <Pencil size={9} className="opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteChar(char)}
                    className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}

              {/* Add button */}
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
              >
                <Plus size={20} />
                <span className="text-xs">{uploading ? 'Uploading...' : 'Add'}</span>
              </button>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple onChange={handleFiles} className="hidden" />
      </div>
    </div>
  )
}
