"use client"

export function MovingTruck({ className = "" }: { className?: string }) {
  return (
    <svg
    width="70"
    height="35"
    
      viewBox="0 0 120 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Truck body - cargo area */}
      <rect
        x="5"
        y="10"
        width="55"
        height="28"
        rx="3"
        className="fill-primary"
      />
      
      {/* Cargo area details */}
      <rect
        x="10"
        y="14"
        width="45"
        height="20"
        rx="2"
        className="fill-primary-foreground/20"
      />
      
      {/* Vertical lines on cargo */}
      <line x1="22" y1="14" x2="22" y2="34" stroke="currentColor" strokeWidth="1" className="stroke-primary-foreground/30" />
      <line x1="34" y1="14" x2="34" y2="34" stroke="currentColor" strokeWidth="1" className="stroke-primary-foreground/30" />
      <line x1="46" y1="14" x2="46" y2="34" stroke="currentColor" strokeWidth="1" className="stroke-primary-foreground/30" />

      {/* Truck cabin */}
      <path
        d="M60 18 L60 38 L85 38 L90 28 L90 23 L85 18 Z"
        className="fill-primary"
      />
      
      {/* Cabin window */}
      <path
        d="M66 20 L66 26 L82 26 L86 20 Z"
        className="fill-secondary/30"
      />
      
      {/* Window reflection */}
      <path
        d="M68 21 L68 24 L75 24 L77 21 Z"
        className="fill-primary-foreground/40"
      />

      {/* Front bumper */}
      <rect
        x="88"
        y="32"
        width="5"
        height="6"
        rx="1"
        className="fill-muted-foreground"
      />
      
      {/* Headlight */}
      <rect
        x="89"
        y="28"
        width="3"
        height="3"
        rx="0.5"
        className="fill-secondary animate-pulse-glow"
      />

      {/* Wheels */}
      <g className="animate-[spin_1s_linear_infinite]" style={{ transformOrigin: '25px 42px' }}>
        <circle cx="25" cy="42" r="7" className="fill-foreground" />
        <circle cx="25" cy="42" r="4" className="fill-muted" />
        <circle cx="25" cy="42" r="2" className="fill-foreground" />
      </g>
      
      <g className="animate-[spin_1s_linear_infinite]" style={{ transformOrigin: '50px 42px' }}>
        <circle cx="50" cy="42" r="7" className="fill-foreground" />
        <circle cx="50" cy="42" r="4" className="fill-muted" />
        <circle cx="50" cy="42" r="2" className="fill-foreground" />
      </g>
      
      <g className="animate-[spin_1s_linear_infinite]" style={{ transformOrigin: '78px 42px' }}>
        <circle cx="78" cy="42" r="7" className="fill-foreground" />
        <circle cx="78" cy="42" r="4" className="fill-muted" />
        <circle cx="78" cy="42" r="2" className="fill-foreground" />
      </g>

      {/* Motion lines */}
      className="scale-75 opacity-60"

      <line x1="0" y1="25" x2="3" y2="25" className="stroke-secondary/60" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="0" y1="30" x2="5" y2="30" className="stroke-secondary/40" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0;1;0" dur="0.7s" repeatCount="indefinite" />
      </line>
      <line x1="0" y1="35" x2="4" y2="35" className="stroke-secondary/50" strokeWidth="1" strokeLinecap="round">
        <animate attributeName="opacity" values="0;1;0" dur="0.6s" repeatCount="indefinite" />
      </line>

      {/* EasyMovers logo on truck */}
      <text
        x="32"
        y="27"
        className="fill-primary-foreground text-[6px] font-bold"
        textAnchor="middle"
      >
        EasyMovers
      </text>
    </svg>
  )
}

export function FloatingBoxes() {
  return (
    <div className="relative h-full w-full">
      {/* Box 1 */}
      <div className="absolute left-[10%] top-[20%] animate-float">
        <svg viewBox="0 0 40 40" className="h-12 w-12">
          <path d="M20 5 L35 15 L35 30 L20 40 L5 30 L5 15 Z" className="fill-secondary/80" />
          <path d="M20 5 L35 15 L20 25 L5 15 Z" className="fill-secondary" />
          <path d="M20 25 L35 15 L35 30 L20 40 Z" className="fill-secondary/60" />
          <line x1="20" y1="5" x2="20" y2="25" className="stroke-primary-foreground/30" strokeWidth="1" />
        </svg>
      </div>
      
      {/* Box 2 */}
      <div className="absolute right-[15%] top-[30%] animate-float-delay-1">
        <svg viewBox="0 0 40 40" className="h-10 w-10">
          <path d="M20 5 L35 15 L35 30 L20 40 L5 30 L5 15 Z" className="fill-primary/80" />
          <path d="M20 5 L35 15 L20 25 L5 15 Z" className="fill-primary" />
          <path d="M20 25 L35 15 L35 30 L20 40 Z" className="fill-primary/60" />
        </svg>
      </div>
      
      {/* Box 3 */}
      <div className="absolute bottom-[25%] left-[25%] animate-float-delay-2">
        <svg viewBox="0 0 40 40" className="h-8 w-8">
          <path d="M20 5 L35 15 L35 30 L20 40 L5 30 L5 15 Z" className="fill-secondary/70" />
          <path d="M20 5 L35 15 L20 25 L5 15 Z" className="fill-secondary/90" />
          <path d="M20 25 L35 15 L35 30 L20 40 Z" className="fill-secondary/50" />
        </svg>
      </div>

      {/* Box 4 - Cardboard style */}
      <div className="absolute right-[20%] bottom-[35%] animate-float">
        <svg viewBox="0 0 40 45" className="h-14 w-14">
          <rect x="5" y="12" width="30" height="28" rx="2" className="fill-amber-600" />
          <rect x="5" y="12" width="30" height="8" rx="2" className="fill-amber-700" />
          <path d="M5 20 L20 15 L35 20" className="stroke-amber-800/50" strokeWidth="1" fill="none" />
          <line x1="20" y1="12" x2="20" y2="40" className="stroke-amber-800/30" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      </div>
    </div>
  )
}
