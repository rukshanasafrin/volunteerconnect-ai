// Small, dependency-free SVG charts — no recharts/chart.js install needed.

export function MiniBarChart({ data, valueKey, labelKey, color = '#2563EB', height = 160 }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-xs font-semibold text-gray-600">{d[valueKey]}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${(d[valueKey] / max) * (height - 40)}px`, minHeight: d[valueKey] > 0 ? '4px' : '0', backgroundColor: color }}
          />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777']

export function MiniPieChart({ data, valueKey, labelKey, size = 160 }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
  const total = data.reduce((sum, d) => sum + d[valueKey], 0) || 1
  let cumulative = 0
  const radius = size / 2
  const slices = data.map((d, i) => {
    const fraction = d[valueKey] / total
    const startAngle = cumulative * 2 * Math.PI
    cumulative += fraction
    const endAngle = cumulative * 2 * Math.PI
    const x1 = radius + radius * Math.sin(startAngle)
    const y1 = radius - radius * Math.cos(startAngle)
    const x2 = radius + radius * Math.sin(endAngle)
    const y2 = radius - radius * Math.cos(endAngle)
    const largeArc = fraction > 0.5 ? 1 : 0
    return {
      path: `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: PIE_COLORS[i % PIE_COLORS.length],
      label: d[labelKey], value: d[valueKey],
    }
  })

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600 capitalize">{s.label}</span>
            <span className="text-gray-400">({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}