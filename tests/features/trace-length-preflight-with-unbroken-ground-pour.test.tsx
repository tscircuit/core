import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: length preflight blocks a short connection to a declared ground plane", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
    // Pours are rendered after routing, so the preflight must use their declarations.
    expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
  })

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter="auto-local"
      autorouterVersion="beta_pipeline7"
    >
      <pcbnotetext pcbY={-4} fontSize={0.7} text="GND: 2mm TO INNER PLANE" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-4}
        maxDecouplingTraceLength="30mm"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={4}
        connections={{ pin1: "net.GND", pin2: "net.SPARE" }}
      />
      <trace
        name="ground_stitch"
        from=".C1 > .pin2"
        to="net.GND"
        maxLength="2mm"
      />
      <copperpour
        layer="inner1"
        connectsTo="net.GND"
        clearance="0.3mm"
        boardEdgeMargin="0.5mm"
        unbroken
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(autoroutingStartCount).toBe(0)
  const routingErrors = circuit.db.pcb_autorouting_error.list()
  expect(routingErrors).toHaveLength(1)
  expect(routingErrors[0].message).toContain("maximum length")
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  expect(
    circuit.db.source_trace.getWhere({ name: "ground_stitch" })!.max_length,
  ).toBe(2)
})
