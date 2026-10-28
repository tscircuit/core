import { pcbLayoutProps } from "@tscircuit/props"

/**
 * Shared base props for breakout points — layout props without rotation/layer.
 * Subclasses extend this schema with additional fields (e.g. `connection`).
 */
export const baseBreakoutPointProps = pcbLayoutProps.omit({
  pcbRotation: true,
  layer: true,
})
