// ── Shared Framer Motion variants ─────────────────────────────────────────
export const fadeUp = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const fadeIn = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
  exit:     { opacity: 0 },
  transition: { duration: 0.22 },
}

export const slideRight = {
  initial:  { opacity: 0, x: -20 },
  animate:  { opacity: 1, x: 0 },
  exit:     { opacity: 0, x: -20 },
  transition: { duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const scaleIn = {
  initial:  { opacity: 0, scale: 0.94 },
  animate:  { opacity: 1, scale: 1 },
  exit:     { opacity: 0, scale: 0.94 },
  transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.055, delayChildren: 0.05 },
  },
}

export const staggerItem = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const sidebarVariants = {
  open:   { width: 220, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  closed: { width: 60,  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

export const modalVariants = {
  initial:  { opacity: 0, scale: 0.96, y: 8 },
  animate:  { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
}

export const commandVariants = {
  initial:  { opacity: 0, scale: 0.97, y: -8 },
  animate:  { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.16 } },
}

// Ease presets matching cubic-bezier values
export const ease = {
  out:    [0.25, 0.46, 0.45, 0.94] as number[],
  in:     [0.55, 0.06, 0.68, 0.19] as number[],
  inOut:  [0.45, 0.05, 0.55, 0.95] as number[],
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
}
