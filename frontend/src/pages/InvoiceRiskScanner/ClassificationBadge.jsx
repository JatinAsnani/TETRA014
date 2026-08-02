import React from 'react'

export default function ClassificationBadge({ classification, className = '' }) {
  let badgeStyle = 'bg-slate-700/60 text-slate-300 border-slate-600'
  let label = 'Missing Information'
  let dotColor = 'bg-slate-400'

  if (classification === 'VERIFIED_MISMATCH') {
    badgeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    label = 'Verified Mismatch'
    dotColor = 'bg-rose-500'
  } else if (classification === 'UNRESOLVED_INCONSISTENCY') {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    label = 'Unresolved Inconsistency'
    dotColor = 'bg-amber-400'
  } else if (classification === 'MISSING_INFORMATION') {
    badgeStyle = 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    label = 'Missing Information'
    dotColor = 'bg-slate-400'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  )
}
