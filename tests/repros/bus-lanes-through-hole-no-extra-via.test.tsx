import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus_lanes routes bottom SMD to through-hole header on bottom without extra vias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={-4}
        pcbY={-1.27}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={-4}
        pcbY={1.27}
      />
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={4}
        pcbY={0}
        pcbRotation={90}
      />
      <trace name="DATA0" from=".R1 > .pin2" to=".J1 > .pin1" />
      <trace name="DATA1" from=".R2 > .pin2" to=".J1 > .pin2" />
      <autoroutingphase
        name="LANES"
        phaseIndex={0}
        autorouter="bus_lanes"
        connections={["R1.pin2", "R2.pin2"]}
      />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        maxLengthSkew="0.1mm"
        pcbTraceWidth="0.15mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThanOrEqual(2)

  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias).toHaveLength(0)

  for (const trace of pcbTraces) {
    const wireLayers = trace.route
      .filter((seg) => seg.route_type === "wire")
      .map((seg) => seg.layer)
    expect(wireLayers.length).toBeGreaterThan(0)
    expect(wireLayers.every((layer) => layer === "bottom")).toBe(true)
  }
})

test("bus_lanes keeps routing top SMD to through-hole header on top without vias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        layer="top"
        pcbX={-4}
        pcbY={-1.27}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="top"
        pcbX={-4}
        pcbY={1.27}
      />
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={4}
        pcbY={0}
        pcbRotation={90}
      />
      <trace name="DATA0" from=".R1 > .pin2" to=".J1 > .pin1" />
      <trace name="DATA1" from=".R2 > .pin2" to=".J1 > .pin2" />
      <autoroutingphase
        name="LANES"
        phaseIndex={0}
        autorouter="bus_lanes"
        connections={["R1.pin2", "R2.pin2"]}
      />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        maxLengthSkew="0.1mm"
        pcbTraceWidth="0.15mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThanOrEqual(2)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)

  for (const trace of pcbTraces) {
    const wireLayers = trace.route
      .filter((seg) => seg.route_type === "wire")
      .map((seg) => seg.layer)
    expect(wireLayers.length).toBeGreaterThan(0)
    expect(wireLayers.every((layer) => layer === "top")).toBe(true)
  }
})
