export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className={`text-2xl font-black tracking-wide ${light ? 'text-white' : 'text-wine-deep'}`}>RAVIN</span>
      <span className={`text-[11px] font-semibold ${light ? 'text-[#D9B6A5]' : 'text-ink-faint'}`} dir="ltr">
        QUALITY CONTROL
      </span>
    </div>
  )
}
