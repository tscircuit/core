import { expect, test } from "bun:test"
import type { z } from "zod"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"

test("group fanout props configure its default routing plan", () => {
  const trace = {
    props: {},
    _findConnectedNets: () => ({ nets: [] }),
  } as unknown as Trace
  const group = {
    _parsedProps: {
      busFanoutDirections: {
        DATA: "center_right",
        ADDRESS: { direction: "center_left" },
      },
      fanoutBoundaryPadding: { left: 1.2, right: 1.4 },
      fanoutRoutingLayers: ["top", "inner3"],
      fanoutPourNetMap: {
        inner1: "GND",
        inner2: "VCC",
      },
    },
    selectAll: (selector: string) => (selector === "trace" ? [trace] : []),
  } as unknown as Group<z.ZodType>

  const plans = Group_getRoutingPhasePlans(group)

  expect(plans).toHaveLength(1)
  expect(plans[0]).toMatchObject({
    busFanoutDirections: {
      DATA: "center_right",
      ADDRESS: { direction: "center_left" },
    },
    fanoutBoundaryPadding: { left: 1.2, right: 1.4 },
    fanoutRoutingLayers: ["top", "inner3"],
    fanoutPourNetMap: {
      inner1: "GND",
      inner2: "VCC",
    },
    traces: [trace],
  })
})
