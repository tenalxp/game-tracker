import { useState, useEffect } from 'react'
import { X, Check, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CharacterLibraryModal from './CharacterLibraryModal'

export default function CharacterPickerModal({ game, account, onClose, onSave }) {
  const [library, setLibrary] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [libRes, assignedRes] = await Promise.all([
      supabase.from('characters').select('*').eq('game_id', game.id).order('sort_order'),
      supabase.from('account_characters').select('character_id').eq('account_id', account.id),
    ])
    setLibrary(libRes.data || [])
    setSelected(new Set((assignedRes.data || []).map(a => a.character_id)))
    setLoading(false)
  }

  function toggle(id) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function save() {
    setSaving(true)
    // Delete all existing
    await supabase.from('account_characters').delete().eq('account_id', account.id)
    // Insert selected
    if (selected.size > 0) {
      await supabase.from('account_characters').insert(
        Array.from(selected).map(character_id => ({ account_id: account.id, character_id }))
      )
    }
    setSaving(false)
    onSave()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <div>
              <h2 className="font-bold text-lg">Select Characters</h2>
              <p className="text-slate-400 text-sm">{account.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLibrary(true)}
                className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Manage library"
              >
                <BookOpen size={18} />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-slate-500 text-center py-8">Loading...</div>
            ) : library.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p className="mb-3">No characters in library yet.</p>
                <button onClick={() => setShowLibrary(true)} className="text-sm underline" style={{ color: game.color }}>
                  Add characters to library
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {library.map(char => {
                  const isSelected = selected.has(char.id)
                  return (
                    <button
                      key={char.id}
                      onClick={() => toggle(char.id)}
                      className="relative group"
                    >
                      <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'scale-95' : 'border-transparent hover:border-slate-500'}`}
                        style={{ borderColor: isSelected ? game.color : undefined }}>
                        <img src={char.image_url} alt={char.name || ''} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white rounded-full p-0.5">
                              <Check size={14} style={{ color: game.color }} />
                            </div>
                          </div>
                        )}
                      </div>
                      {char.name && (
                        <p className="text-xs text-center mt-1 text-slate-400 truncate">{char.name}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium text-sm">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: game.color }}
            >
              {saving ? 'Saving...' : `Save (${selected.size})`}
            </button>
          </div>
        </div>
      </div>

      {showLibrary && (
        <CharacterLibraryModal
          game={game}
          onClose={() => { setShowLibrary(false); fetchData() }}
        />
      )}
    </>
  )
}
