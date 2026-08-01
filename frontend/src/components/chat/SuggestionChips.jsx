export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions?.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 text-xs bg-blue-50 text-primary border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
