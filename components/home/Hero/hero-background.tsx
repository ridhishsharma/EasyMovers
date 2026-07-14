"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Background
   File: hero-background.tsx
   Version: 1.0
============================================================ */

/* import { ReactNode } from "react" */
import { motion } from "framer-motion"


export default function HeroBackground() {

  return (
    <section className="relative isolate overflow-hidden bg-white">

      {/* ===========================================================
          Base Gradient
      ============================================================ */}

      <div
        className="
          absolute
          inset-0
          -z-50

          bg-gradient-to-br
          from-orange-50
          via-white
          to-blue-50
        "
      />

      {/* ===========================================================
          Enterprise Grid
      ============================================================ */}

      <div
        className="
          absolute
          inset-0
          -z-40

          bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)]

          bg-[size:48px_48px]

          [mask-image:radial-gradient(circle_at_center,black,transparent_90%)]

          pointer-events-none
        "
      />

      {/* ===========================================================
          Left Orange Glow
      ============================================================ */}

      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          left-[-180px]
          top-[-180px]
          -z-30

          h-[520px]
          w-[520px]

          rounded-full

          bg-orange-400/20

          blur-[130px]
        "
      />

      {/* ===========================================================
          Right Blue Glow
      ============================================================ */}

      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -25, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          right-[-220px]
          top-[80px]
          -z-30

          h-[560px]
          w-[560px]

          rounded-full

          bg-blue-500/15

          blur-[150px]
        "
      />

      {/* ===========================================================
          Bottom Accent Glow
      ============================================================ */}

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-[-240px]
          left-1/2
          -translate-x-1/2
          -z-30

          h-[520px]
          w-[720px]

          rounded-full

          bg-orange-300/10

          blur-[160px]
        "
      />

      {/* ===========================================================
          Floating Decorative Particles
      ============================================================ */}

      {[...Array(12)].map((_, index) => {

        const size = 4 + (index % 4) * 3

        const left = `${8 + index * 7}%`

        const delay = index * 0.7

        return (

          <motion.span
            key={index}
            initial={{
              opacity: 0.15,
              y: 0,
            }}
            animate={{
              opacity: [0.15, 0.35, 0.15],
              y: [-12, 12, -12],
            }}
            transition={{
              duration: 6 + index,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -z-20 rounded-full bg-orange-400"
            style={{
              width: size,
              height: size,
              left,
              top: `${18 + (index % 5) * 15}%`,
            }}
          />

        )

      })}

      {/* ===========================================================
          Decorative Glass Panel
      ============================================================ */}

      <div
        className="
          absolute
          right-[6%]
          top-[12%]
          -z-20
          hidden
          xl:block

          h-[420px]
          w-[420px]

          rounded-[48px]

          border
          border-white/40

          bg-white/20

          backdrop-blur-3xl
        "
      />

      {/* ===========================================================
          Hero Container
      ============================================================ */}

     <div
  className="
    relative

    container
    mx-auto

    min-h-screen

    px-6

    pt-32
    pb-20

    lg:px-8
    xl:px-12
  "
/>

</section>  )
}