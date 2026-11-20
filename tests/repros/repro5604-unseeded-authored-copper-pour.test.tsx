import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "circuit-json-to-kicad"
import { CopperPour } from "lib/components/primitive-components/CopperPour"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.each([
  { layers: 4, layer: "inner1" },
  { layers: 2, layer: "bottom" },
] as const)(
  "unseeded authored $layer pour is not removed silently and preserves warning and KiCad zone",
  async ({ layers, layer }) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="10mm" layers={layers}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0603"
          connections={{ pin1: "net.GND", pin2: "net.GND" }}
        />
        <copperpour connectsTo="net.GND" layer={layer} />
      </board>,
    )
    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()
    const pours = circuitJson.filter((e) => e.type === "pcb_copper_pour")
    const warnings = circuitJson.filter(
      (e) => e.type === "pcb_copper_pour_isolated_warning",
    )

    expect(pours).toHaveLength(1)
    expect(pours[0]!.layer).toBe(layer)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({
      type: "pcb_copper_pour_isolated_warning",
      pcb_copper_pour_id: pours[0]!.pcb_copper_pour_id,
      layer,
    })
    expect(warnings[0]!.message).toContain("GND")

    const converter = new CircuitJsonToKicadPcbConverter(circuitJson)
    converter.runUntilFinished()
    expect(converter.getOutput().zones).toHaveLength(1)
  },
)

test("same-layer unseeded authored copper pour outline is preserved with isolated warning", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-6}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: 1, y: -4 },
          { x: 9, y: -4 },
          { x: 9, y: 4 },
          { x: 1, y: 4 },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list()
  const warnings = circuit.db.pcb_copper_pour_isolated_warning.list()

  expect(pours).toHaveLength(1)
  expect(pours[0]!.layer).toBe("top")
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    pcb_copper_pour_id: pours[0]!.pcb_copper_pour_id,
    layer: "top",
  })
})

test("seeded pour still prunes floating islands while unseeded authored inner1 pour is preserved", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" layers={4}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-9}
        pcbY={-5}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={9} pcbY={-5} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={0} pcbY={5} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R3 > .pin1" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
      <copperpour connectsTo="net.GND" layer="inner1" clearance="0.3mm" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list()
  const topPours = pours.filter((pour) => pour.layer === "top")
  const inner1Pours = pours.filter((pour) => pour.layer === "inner1")
  const warnings = circuit.db.pcb_copper_pour_isolated_warning.list()

  // Top pour had two split halves; only the floating bottom half is pruned.
  expect(topPours).toHaveLength(1)
  expect(inner1Pours).toHaveLength(1)
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    pcb_copper_pour_id: inner1Pours[0]!.pcb_copper_pour_id,
    layer: "inner1",
  })
})

test("unseeded implicit copper pour is still removed during cleanup", async () => {
  const { circuit } = getTestFixture()
  const implicitPour = new CopperPour({
    connectsTo: "net.GND",
    layer: "bottom",
  })
  implicitPour._isImplicitCopperPour = true

  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
    </board>,
  )
  circuit._getBoard()!.add(implicitPour)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
  expect(circuit.db.pcb_copper_pour_isolated_warning.list()).toHaveLength(0)
})

test("via stitching removes generated floating stitching vias while keeping unseeded authored pours", async () => {
  const { circuit } = getTestFixture()
  let generatedBeforeCleanup = 0
  circuit.on("board:renderPhaseStarted", ({ phase }) => {
    if (phase === "PcbCopperPourCleanup") {
      generatedBeforeCleanup =
        circuit._getBoard()?._generatedStitchingViaIds?.size ?? 0
    }
  })

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={4}
      enableViaStitching
      viaStitchPitch="2mm"
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-6}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: 1, y: -4 },
          { x: 9, y: -4 },
          { x: 9, y: 4 },
          { x: 1, y: 4 },
        ]}
      />
      <copperpour
        connectsTo="net.GND"
        layer="bottom"
        outline={[
          { x: 1, y: -4 },
          { x: 9, y: -4 },
          { x: 9, y: 4 },
          { x: 1, y: 4 },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const board = circuit._getBoard()!
  expect(generatedBeforeCleanup).toBeGreaterThan(0)
  expect(
    circuit.db.pcb_via
      .list()
      .filter((via) => board._generatedStitchingViaIds?.has(via.pcb_via_id)),
  ).toHaveLength(0)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(2)
  expect(circuit.db.pcb_copper_pour_isolated_warning.list()).toHaveLength(2)
})
