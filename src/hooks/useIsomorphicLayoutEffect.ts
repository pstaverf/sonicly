import { useEffect, useLayoutEffect } from 'react'

/**
 * The layout effect runs before the browser paints, so the motion starts
 * with the right picture. On the server there is no paint, so the plain
 * effect does the work there and the markup of the server stays quiet.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect
