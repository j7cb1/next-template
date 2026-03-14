"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/utilities/shadcn"
import { useActivitySignal } from "@/hooks/use-ui-activity"

const HEX_CHARS = "0123456789ABCDEF"
const SCRAMBLE_LENGTH = 8
const SCRAMBLE_FPS = 50 // ms between ticks (~20fps)
const RESOLVE_DURATION = 600 // ms to resolve all characters
const DISSOLVE_DURATION = 350 // ms to dissolve into scramble

const randomChar = () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
const randomString = (len: number) =>
  Array.from({ length: len }, randomChar).join("")

type Phase = "idle" | "dissolving" | "scrambling" | "resolving"

interface HyperTextProps {
  /** Text to resolve to. While scrambling with no children, shows random hex. */
  children?: string
  className?: string
  /** While true, continuously scramble. When flipped to false, resolves into children. */
  scrambling?: boolean
}

export function HyperText({
  children,
  className,
  scrambling = false,
}: HyperTextProps) {
  const [display, setDisplay] = useState(children ?? "")
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const phaseStartRef = useRef(0)
  const phaseRef = useRef<Phase>("idle")
  const frozenTextRef = useRef("") // snapshot of text when dissolve starts
  const { increment, decrement } = useActivitySignal()
  const activeRef = useRef(false)

  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  useEffect(() => {
    cleanup()

    const signalActive = () => {
      if (!activeRef.current) { activeRef.current = true; increment() }
    }
    const signalIdle = () => {
      if (activeRef.current) { activeRef.current = false; decrement() }
    }

    if (scrambling) {
      signalActive()
      // Capture current display to dissolve from
      const currentText = frozenTextRef.current || display
      frozenTextRef.current = currentText

      if (currentText && currentText !== randomString(SCRAMBLE_LENGTH)) {
        // Dissolve phase: scramble right-to-left from the existing number
        phaseRef.current = "dissolving"
        phaseStartRef.current = 0
        const sourceLen = currentText.length

        const tick = (time: number) => {
          if (!phaseStartRef.current) phaseStartRef.current = time
          const elapsed = time - phaseStartRef.current
          const progress = Math.min(elapsed / DISSOLVE_DURATION, 1)

          // Number of chars scrambled from the right
          const scrambledCount = Math.floor(progress * sourceLen)

          if (time - lastTickRef.current > SCRAMBLE_FPS) {
            lastTickRef.current = time
            // Shrink toward SCRAMBLE_LENGTH as we dissolve
            const visibleLen = sourceLen > SCRAMBLE_LENGTH
              ? Math.round(sourceLen - (sourceLen - SCRAMBLE_LENGTH) * progress)
              : sourceLen < SCRAMBLE_LENGTH
                ? Math.round(sourceLen + (SCRAMBLE_LENGTH - sourceLen) * progress)
                : sourceLen

            const result = Array.from({ length: visibleLen }, (_, i) => {
              const lockBoundary = visibleLen - scrambledCount
              if (i < lockBoundary && i < currentText.length) return currentText[i]
              return randomChar()
            }).join("")
            setDisplay(result)
          }

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick)
          } else {
            // Transition to continuous scramble
            phaseRef.current = "scrambling"
            const scrambleTick = (t: number) => {
              if (t - lastTickRef.current > SCRAMBLE_FPS) {
                lastTickRef.current = t
                setDisplay(randomString(SCRAMBLE_LENGTH))
              }
              rafRef.current = requestAnimationFrame(scrambleTick)
            }
            rafRef.current = requestAnimationFrame(scrambleTick)
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // No existing text, go straight to scramble
        phaseRef.current = "scrambling"
        const tick = (time: number) => {
          if (time - lastTickRef.current > SCRAMBLE_FPS) {
            lastTickRef.current = time
            setDisplay(randomString(SCRAMBLE_LENGTH))
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }
    } else if (children) {
      signalActive()
      phaseRef.current = "resolving"
      phaseStartRef.current = 0
      const target = children
      const targetLen = target.length

      const tick = (time: number) => {
        if (!phaseStartRef.current) phaseStartRef.current = time
        const elapsed = time - phaseStartRef.current
        const progress = Math.min(elapsed / RESOLVE_DURATION, 1)

        // Grow visible length from SCRAMBLE_LENGTH toward targetLen
        const visibleLen = targetLen <= SCRAMBLE_LENGTH
          ? targetLen
          : Math.round(SCRAMBLE_LENGTH + (targetLen - SCRAMBLE_LENGTH) * progress)

        // Lock characters left to right within the visible portion
        const lockedCount = Math.floor(progress * visibleLen)

        if (time - lastTickRef.current > SCRAMBLE_FPS) {
          lastTickRef.current = time
          const result = Array.from({ length: visibleLen }, (_, i) => {
            if (i < lockedCount) return target[i]
            if (i < targetLen && (target[i] === "." || target[i] === " " || target[i] === ",")) return target[i]
            return randomChar()
          }).join("")
          setDisplay(result)
        }

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setDisplay(target)
          frozenTextRef.current = target
          phaseRef.current = "idle"
          rafRef.current = null
          signalIdle()
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      phaseRef.current = "idle"
      setDisplay("")
      frozenTextRef.current = ""
      signalIdle()
    }

    return () => { cleanup(); signalIdle() }
  }, [scrambling, children])

  return (
    <span className={cn("inline-flex font-mono", className)}>
      {display}
    </span>
  )
}
