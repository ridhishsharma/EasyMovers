"use client"

import { motion } from "framer-motion"

const routes = [
{
from: "Delhi",
to: "Mumbai",
top: "20%",
left: "15%",
},
{
from: "Bangalore",
to: "Hyderabad",
top: "45%",
left: "55%",
},
{
from: "Pune",
to: "Ahmedabad",
top: "65%",
left: "30%",
},
]

export default function AnimatedRouteMap() {
return ( <div className="relative h-[180px] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-xl">

  {/* GRID */}
  <div
    className="absolute inset-0 opacity-20"
    style={{
      backgroundImage: `
        linear-gradient(rgba(251,146,60,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(251,146,60,0.15) 1px, transparent 1px)
      `,
      backgroundSize: "22px 22px",
    }}
  />

  {/* TITLE */}
  <div className="absolute left-4 top-4 z-20 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-1.5 backdrop-blur-sm">
    <p className="text-xs font-semibold tracking-wide text-orange-300">
      LIVE ACTIVE ROUTES
    </p>
  </div>

  {/* ROUTES */}
  {routes.map((route, index) => (
    <motion.div
      key={index}
      className="absolute"
      style={{
        top: route.top,
        left: route.left,
      }}
      initial={{ opacity: 0.3 }}
      animate={{
        opacity: [0.3, 1, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay: index * 0.8,
      }}
    >

      {/* ROUTE CARD */}
      <div className="rounded-xl border border-orange-400/20 bg-white/5 px-4 py-2 backdrop-blur-md shadow-lg">

        <div className="flex items-center gap-2">

          {/* PULSE DOT */}
          <motion.div
            className="h-2.5 w-2.5 rounded-full bg-orange-400"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
          />

          {/* ROUTE TEXT */}
          <p className="text-sm font-medium text-orange-100">
            {route.from}
            <span className="mx-2 text-orange-400">→</span>
            {route.to}
          </p>

        </div>
      </div>
    </motion.div>
  ))}

  {/* GLOW EFFECT */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.08),transparent_70%)]" />
</div>

)
}
