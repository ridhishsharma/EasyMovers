"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Background Animation

   File: process-animation.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

/* ============================================================
   Component
============================================================ */

export default function ProcessAnimation() {

  return (

    <div

      className="
        pointer-events-none

        absolute

        inset-0

        overflow-hidden
      "

    >

      {/* ===============================================
          Floating Gradient Orb - Left
      ================================================ */}

      <motion.div

        animate={{

          x: [0, 40, 0],

          y: [0, -40, 0],

          scale: [1, 1.15, 1],

        }}

        transition={{

          duration: 12,

          repeat: Infinity,

          ease: "easeInOut",

        }}

        className="
          absolute

          left-[-120px]

          top-24

          h-72

          w-72

          rounded-full

          bg-orange-300/20

          blur-3xl
        "

      />

      {/* ===============================================
          Floating Gradient Orb - Right
      ================================================ */}

      <motion.div

        animate={{

          x: [0, -35, 0],

          y: [0, 30, 0],

          scale: [1, 1.2, 1],

        }}

        transition={{

          duration: 15,

          repeat: Infinity,

          ease: "easeInOut",

        }}

        className="
          absolute

          right-[-100px]

          top-64

          h-80

          w-80

          rounded-full

          bg-cyan-300/20

          blur-3xl
        "

      />

      {/* ===============================================
          Floating Grid
      ================================================ */}

      <motion.div

        animate={{

          opacity: [0.2, 0.4, 0.2],

        }}

        transition={{

          duration: 6,

          repeat: Infinity,

        }}

        className="
          absolute

          inset-0
        "

      >
        <div

          className="
            h-full

            w-full

            bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]

            bg-[size:60px_60px]

            opacity-30
          "

        />

      </motion.div>

      {/* ===============================================
          Floating Dots
      ================================================ */}

      {Array.from({ length: 12 }).map((_, index) => (

        <motion.div

          key={index}

          initial={{

            opacity: 0,

            scale: 0,

          }}

          animate={{

            opacity: [0.15, 0.5, 0.15],

            scale: [1, 1.6, 1],

            y: [0, -25, 0],

          }}

          transition={{

            duration: 4 + index,

            delay: index * 0.4,

            repeat: Infinity,

            ease: "easeInOut",

          }}

          className="
            absolute

            h-2

            w-2

            rounded-full

            bg-orange-400/60
          "

          style={{

            left: `${8 + index * 7}%`,

            top: `${15 + (index % 5) * 16}%`,

          }}

        />

      ))}

      {/* ===============================================
          Animated Light Beam
      ================================================ */}

      <motion.div

        animate={{

          x: [

            "-30%",

            "130%",

          ],

        }}

        transition={{

          duration: 8,

          repeat: Infinity,

          ease: "linear",

        }}

        className="
          absolute

          top-0

          h-full

          w-32

          -skew-x-12

          bg-gradient-to-r

          from-transparent

          via-white/20

          to-transparent
        "

      />

      {/* ===============================================
          Animated Rings
      ================================================ */}

      <motion.div

        animate={{

          rotate: 360,

        }}

        transition={{

          duration: 60,

          repeat: Infinity,

          ease: "linear",

        }}

        className="
          absolute

          left-1/2

          top-1/2

          h-[700px]

          w-[700px]

          -translate-x-1/2

          -translate-y-1/2

          rounded-full

          border

          border-orange-100/30
        "

      />

      <motion.div

        animate={{

          rotate: -360,

        }}

        transition={{

          duration: 90,

          repeat: Infinity,

          ease: "linear",

        }}

        className="
          absolute

          left-1/2

          top-1/2

          h-[520px]

          w-[520px]

          -translate-x-1/2

          -translate-y-1/2

          rounded-full

          border

          border-cyan-100/30
        "

      />

    </div>

  )

}

/* ===========================================================
   Future Enhancements

   Phase 2
   ----------------------------------------------------------
   • Animated workflow particles
   • SVG path animations
   • AI neural network background

   Phase 3
   ----------------------------------------------------------
   • Interactive logistics map
   • Dynamic moving vehicle paths
   • Live progress visualization

   Phase 4
   ----------------------------------------------------------
   • AI data flow animation
   • Corporate workflow dashboard
   • Global relocation visualization

   Phase 5
   ----------------------------------------------------------
   • WebGL particle effects
   • Three.js enterprise background
   • Real-time animated world map
=========================================================== */