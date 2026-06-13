interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { main: 'text-lg', sub: 'text-[8px] tracking-[0.45em]' },
  md: { main: 'text-2xl', sub: 'text-[10px] tracking-[0.5em]' },
  lg: { main: 'text-4xl', sub: 'text-xs tracking-[0.55em]' },
}

/** Logo chữ "TRUNG ANH GROUP" theo nhận diện thương hiệu. */
export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const s = SIZES[size]
  return (
    <div className={`flex flex-col items-center leading-none ${className}`}>
      <span className={`font-extrabold tracking-tight text-brand-navy ${s.main}`}>
        TRUNG ANH
      </span>
      <span className={`font-semibold text-brand ${s.sub}`}>GROUP</span>
    </div>
  )
}
