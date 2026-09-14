import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
test("bus_lanes does not fall back to a multilayer router", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} doubleSidedAssembly>
      <autoroutingphase name="NO_VIAS" phaseIndex={0} autorouter="bus_lanes" />
      <resistor name="TOP" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor
        name="BOTTOM"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        layer="bottom"
      />
      <trace
        name="DATA"
        from=".TOP > .pin2"
        to=".BOTTOM > .pin1"
        routingPhaseIndex={0}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2.8}
        fontSize={0.32}
        text="DATA connects TOP.pin2 (top) to BOTTOM.pin1 (bottom)."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.45}
        fontSize={0.32}
        text="bus_lanes rejects endpoints without a common fixed layer."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.1}
        fontSize={0.32}
        text="Expected routing error: no traces, vias, or router fallback."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(
    json.some(
      (e) =>
        e.type === "pcb_autorouting_error" &&
        e.message.includes("common fixed layer"),
    ),
  ).toBe(true)
  expect(
    json.filter((e) => e.type === "pcb_via" || e.type === "pcb_trace"),
  ).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
