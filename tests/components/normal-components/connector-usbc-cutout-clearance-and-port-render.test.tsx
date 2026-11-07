import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import usbCC2765186CircuitJson from "tests/fixtures/assets/usb-c-C2765186.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector standard='usb_c' default part C2765186 passes placement cutout checks and autoroutes", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C2765186"] }),
    fetchPartCircuitJson: async () =>
      usbCC2765186CircuitJson as AnyCircuitElement[],
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="30mm" height="20mm">
      <connector name="USBC" standard="usb_c" />
      <resistor name="R1" resistance="5.1k" footprint="0402" pcbX={10} />
      <trace from="USBC.CC1" to="R1.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cutoutPlacementErrors = circuit.db.pcb_placement_error
    .list()
    .filter((err) =>
      err.pcb_placement_error_id?.startsWith("copper_to_cutout_"),
    )
  expect(cutoutPlacementErrors).toEqual([])
  expect(circuit.db.pcb_hole.list()).toHaveLength(2)
  expect(circuit.db.pcb_cutout.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})

test("connector standard='usb_c' re-renders pcb_port coordinates when async footprint resolves after initial PcbPortRender", async () => {
  const { circuit } = getTestFixture()

  let resolvePart!: (value: AnyCircuitElement[]) => void
  const delayedPartPromise = new Promise<AnyCircuitElement[]>((resolve) => {
    resolvePart = resolve
  })

  const delayedPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C2765186"] }),
    fetchPartCircuitJson: () => delayedPartPromise,
  }

  circuit.add(
    <board
      partsEngine={delayedPartsEngine}
      width="30mm"
      height="20mm"
      routingDisabled
    >
      <connector name="USBC" standard="usb_c" />
      <resistor name="R1" resistance="5.1k" footprint="0402" pcbX={10} />
      <trace from="USBC.CC1" to="R1.pin1" />
    </board>,
  )

  // Run a synchronous render cycle before the async connector footprint resolves,
  // matching the preview/staged render order where fallback ports initialize PcbPortRender first.
  circuit.render()

  resolvePart(usbCC2765186CircuitJson as AnyCircuitElement[])
  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })

  expect(simpleRouteJson.connections.length).toBeGreaterThan(0)
  for (const conn of simpleRouteJson.connections) {
    for (const pt of conn.pointsToConnect) {
      expect(typeof pt.x).toBe("number")
      expect(typeof pt.y).toBe("number")
    }
  }
})
