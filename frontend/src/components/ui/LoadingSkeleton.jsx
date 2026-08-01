export default function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded-lg" />
      ))}
    </div>
  )
}
