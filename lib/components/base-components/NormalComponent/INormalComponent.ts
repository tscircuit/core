import type { Port } from "lib/components/primitive-components/Port/Port"

export interface INormalComponent {
  _getInternallyConnectedPins(): Port[][]
}
