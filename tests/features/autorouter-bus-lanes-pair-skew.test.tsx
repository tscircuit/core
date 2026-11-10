import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
test("bus_lanes rejects ordered differential pairs instead of silently ignoring skew", async () => {
  const { circuit } = getTestFixture()
  const inputs: any[] = []
  circuit.on("autorouting:start", (event: any) =>
    inputs.push(event.simpleRouteJson),
  )
  circuit.add(
    <board width={14} height={10}>
      <autoroutingphase
        name="BUS_LANES"
        phaseIndex={0}
        autorouter="bus_lanes"
        connections={["A0.pin2", "A1.pin2"]}
      />
      <resistor
        name="A0"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-2}
      />
      <resistor name="B0" resistance="1k" footprint="0402" pcbX={4} pcbY={-2} />
      <resistor name="A1" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <resistor name="B1" resistance="1k" footprint="0402" pcbX={3} pcbY={2} />
      <trace name="DATA0" from=".A0 > .pin2" to=".B0 > .pin1" />
      <trace name="DATA1" from=".A1 > .pin2" to=".B1 > .pin1" />
      <differentialpair
        name="DATA_PAIR"
        positiveConnection="DATA0"
        negativeConnection="DATA1"
        maxLengthSkew="0.5mm"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.2}
        fontSize={0.32}
        text="bus_lanes selects A0.pin2 and A1.pin2; all copper is top."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.85}
        fontSize={0.32}
        text="A1-B1 is 1mm shorter: add only 0.5mm, leaving permitted skew."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.5}
        fontSize={0.32}
        text="Ordered differential pairs require auto_local routing."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([
    expect.objectContaining({
      message:
        'Differential pair "DATA_PAIR": this autorouter or routing scope does not support the requested pair',
    }),
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
