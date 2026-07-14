"use client"

import { useEffect, useState } from "react"

interface AnimatedCounterProps {
endValue: number
duration?: number
}

export function AnimatedCounter({
endValue,
duration = 2000,
}: AnimatedCounterProps) {

const [count, setCount] = useState(0)

useEffect(() => {

let start = 0

const increment = endValue / (duration / 16)

const timer = setInterval(() => {

  start += increment

  if (start >= endValue) {
    setCount(endValue)
    clearInterval(timer)
  } else {
    setCount(start)
  }

}, 16)

return () => clearInterval(timer)

}, [endValue, duration])

return ( <span>
{Number(count).toFixed(
endValue % 1 !== 0 ? 1 : 0
)} </span>
)
}
