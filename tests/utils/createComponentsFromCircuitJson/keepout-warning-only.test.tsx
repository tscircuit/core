import { expect, test } from "bun:test"
import { Keepout } from "lib/components/primitive-components/Keepout"
import type { PcbKeepoutWithWarningOnly } from "lib/utils/circuit-json/pcb-keepout-with-warning-only"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("imported keepouts preserve advisory behavior and layers for both shapes", () => {
  const keepouts: PcbKeepoutWithWarningOnly[] = [
    true,
    false,
    undefined,
  ].flatMap((warning_only, i) => [
    {
      type: "pcb_keepout",
      pcb_keepout_id: `rect_${i}`,
      shape: "rect",
      center: { x: i * 5, y: 0 },
      width: 2,
      height: 3,
      layers: ["bottom"],
      warning_only,
    },
    {
      type: "pcb_keepout",
      pcb_keepout_id: `circle_${i}`,
      shape: "circle",
      center: { x: i * 5, y: 5 },
      radius: 1,
      layers: ["top", "bottom"],
      warning_only,
    },
  ])
  const components = createComponentsFromCircuitJson(
    { componentName: "keepouts", componentRotation: "0", pinLabels: {} },
    keepouts,
  )
  expect(components).toHaveLength(keepouts.length)
  for (const [i, component] of components.entries()) {
    expect(component).toBeInstanceOf(Keepout)
    const props = (component as Keepout)._parsedProps
    expect(props.warningOnly).toBe(keepouts[i].warning_only)
    expect(keepouts[i].layers).toEqual(props.layers!)
  }
  expect(getObstaclesFromCircuitJson(keepouts)).toHaveLength(4)
})
