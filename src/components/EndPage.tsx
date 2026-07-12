const STARS =
  'radial-gradient(1.6px 1.6px at 20% 22%, rgba(255,255,255,0.85), transparent),radial-gradient(1.4px 1.4px at 68% 30%, rgba(255,247,214,0.8), transparent),radial-gradient(1.2px 1.2px at 40% 60%, rgba(255,255,255,0.6), transparent),radial-gradient(1.5px 1.5px at 82% 66%, rgba(255,255,255,0.7), transparent),radial-gradient(1.2px 1.2px at 30% 82%, rgba(255,247,214,0.65), transparent),radial-gradient(1.3px 1.3px at 60% 88%, rgba(255,255,255,0.55), transparent),radial-gradient(1.2px 1.2px at 12% 46%, rgba(255,255,255,0.5), transparent)'

/** The starry "The End" panel shown on the right page past the last spread. */
export default function EndPage() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'radial-gradient(120% 100% at 50% 26%, #36427e, #232a52 52%, #161c38)' }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: STARS }} />
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-[22px]"
        style={{ background: 'linear-gradient(90deg,rgba(12,16,42,0.4),rgba(12,16,42,0))' }}
      />
      <img src="assets/stickers/moon.png" draggable={false} alt="" className="absolute right-[150px] top-[92px] w-[80px]" style={{ filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.4))' }} />
      <img src="assets/stickers/star.png" draggable={false} alt="" className="absolute left-[66px] top-[170px] w-[44px] opacity-95" />
      <img src="assets/stickers/star.png" draggable={false} alt="" className="absolute right-[70px] top-[96px] w-[26px] opacity-80" />
      <div className="absolute left-0 right-0 top-[196px] text-center">
        <div className="font-hand text-[72px] font-bold tracking-[1px] text-[#f6efda]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>The End</div>
        <div className="mt-1 font-type text-[15px] tracking-[4px] text-[#c9cff0]">sweet dreams</div>
      </div>
      <img
        src="assets/stickers/scallion.png"
        draggable={false}
        alt=""
        className="absolute bottom-[34px] left-1/2 w-[118px]"
        style={{ transform: 'translateX(-50%) rotate(-4deg)', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.35))' }}
      />
    </div>
  )
}
