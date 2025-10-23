import "@tscircuit/props"

declare module "@tscircuit/props" {
  interface ConstraintProps {
    pcb?: boolean
    centerX?: number | string
    centerY?: number | string
    xDist?: string | number
    yDist?: string | number
    left?: string
    right?: string
    top?: string
    bottom?: string
    centerToCenter?: boolean
    edgeToEdge?: boolean
    sameY?: boolean
    for?: string[]
  }
}
