const STARS_A =
  'radial-gradient(1.6px 1.6px at 12% 22%, rgba(255,255,255,0.85), transparent),radial-gradient(1.4px 1.4px at 26% 66%, rgba(255,247,214,0.75), transparent),radial-gradient(1.2px 1.2px at 8% 80%, rgba(255,255,255,0.6), transparent),radial-gradient(1.5px 1.5px at 84% 18%, rgba(255,255,255,0.75), transparent),radial-gradient(1.3px 1.3px at 92% 54%, rgba(255,247,214,0.7), transparent),radial-gradient(1.2px 1.2px at 74% 84%, rgba(255,255,255,0.55), transparent),radial-gradient(1.5px 1.5px at 50% 6%, rgba(255,255,255,0.65), transparent),radial-gradient(1.2px 1.2px at 63% 92%, rgba(255,255,255,0.55), transparent),radial-gradient(1.3px 1.3px at 38% 14%, rgba(255,255,255,0.55), transparent)'

const STARS_B =
  'radial-gradient(1.1px 1.1px at 18% 40%, rgba(255,255,255,0.7), transparent),radial-gradient(1px 1px at 44% 30%, rgba(214,226,255,0.7), transparent),radial-gradient(1.2px 1.2px at 68% 62%, rgba(255,255,255,0.65), transparent),radial-gradient(1px 1px at 30% 88%, rgba(255,247,214,0.6), transparent),radial-gradient(1.3px 1.3px at 88% 78%, rgba(255,255,255,0.6), transparent),radial-gradient(1px 1px at 56% 48%, rgba(255,255,255,0.55), transparent),radial-gradient(1.1px 1.1px at 6% 54%, rgba(214,226,255,0.6), transparent),radial-gradient(1px 1px at 96% 36%, rgba(255,255,255,0.55), transparent)'

/** Drifting color glows + two parallax twinkling star layers behind the book. */
export default function Background() {
  return (
    <>
      <div
        className="pointer-events-none absolute -top-[14%] left-[6%] h-[60%] w-[60%] rounded-full blur-[70px] animate-glow1"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(126,120,196,0.55), rgba(126,120,196,0) 68%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-[18%] right-[2%] h-[58%] w-[58%] rounded-full blur-[80px] animate-glow2"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(64,96,150,0.5), rgba(64,96,150,0) 70%)' }}
      />
      <div className="pointer-events-none absolute -inset-20 animate-starsA" style={{ backgroundImage: STARS_A }} />
      <div className="pointer-events-none absolute -inset-20 animate-starsB" style={{ backgroundImage: STARS_B }} />
    </>
  )
}
