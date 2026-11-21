import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint src generates the same JST connector pads and ports while preserving insertionDirection", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={36} height={18} routingDisabled schematicDisabled>
      <connector
        name="J1"
        pinCount={5}
        pcbX={-8}
        footprint="jst5_zh"
        cadModel={null}
        noConnect={["1", "2", "3", "4", "5"]}
      />
      <connector
        name="J2"
        pinCount={5}
        pcbX={8}
        footprint={<footprint src="jst5_zh" insertionDirection="from_above" />}
        cadModel={null}
        noConnect={["1", "2", "3", "4", "5"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const j1Source = circuit.db.source_component.getWhere({ name: "J1" })!
  const j2Source = circuit.db.source_component.getWhere({ name: "J2" })!
  const j1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j1Source.source_component_id,
  })!
  const j2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j2Source.source_component_id,
  })!

  const j1Holes = circuit.db.pcb_plated_hole
    .list({ pcb_component_id: j1Pcb.pcb_component_id })
    .sort((a, b) => a.x - b.x || a.y - b.y)
  const j2Holes = circuit.db.pcb_plated_hole
    .list({ pcb_component_id: j2Pcb.pcb_component_id })
    .sort((a, b) => a.x - b.x || a.y - b.y)

  expect(j1Holes).toHaveLength(5)
  expect(j2Holes).toHaveLength(5)

  for (let i = 0; i < 5; i++) {
    expect(j2Holes[i]!.x - 8).toBeCloseTo(j1Holes[i]!.x - -8, 6)
    expect(j2Holes[i]!.y).toBeCloseTo(j1Holes[i]!.y, 6)
  }

  const j1Ports = circuit.db.pcb_port.list({
    pcb_component_id: j1Pcb.pcb_component_id,
  })
  const j2Ports = circuit.db.pcb_port.list({
    pcb_component_id: j2Pcb.pcb_component_id,
  })
  expect(j1Ports).toHaveLength(5)
  expect(j2Ports).toHaveLength(5)
  expect(j2Pcb.insertion_direction).toBe("from_above")
})

test("footprint src works on chips, child footprint elements, cad models, and library refs", async () => {
  const { circuit } = getTestFixture({
    platform: {
      schematicDisabled: true,
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: fp.string("soic4").soup(),
        }),
      },
    },
  })

  circuit.add(
    <board width={40} height={24}>
      <chip name="U1" pcbX={-12} footprint={<footprint src="soic8" />} />
      <connector name="J3" pinCount={3} pcbX={0}>
        <footprint src="jst3_zh" insertionDirection="from_right" />
      </connector>
      <chip
        name="U2"
        pcbX={12}
        pinLabels={{ pin1: "P1", pin2: "P2", pin3: "P3", pin4: "P4" }}
        footprint={
          <footprint
            src="kicad:Package_SO/SOIC-4"
            insertionDirection="from_above"
          />
        }
      />
      <trace from=".U1 > .pin1" to=".J3 > .pin1" />
      <trace from=".J3 > .pin2" to=".U2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1Source = circuit.db.source_component.getWhere({ name: "U1" })!
  const j3Source = circuit.db.source_component.getWhere({ name: "J3" })!
  const u2Source = circuit.db.source_component.getWhere({ name: "U2" })!

  const u1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: u1Source.source_component_id,
  })!
  const j3Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j3Source.source_component_id,
  })!
  const u2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: u2Source.source_component_id,
  })!

  expect(
    circuit.db.pcb_smtpad.list({ pcb_component_id: u1Pcb.pcb_component_id }),
  ).toHaveLength(8)
  expect(
    circuit.db.pcb_plated_hole.list({
      pcb_component_id: j3Pcb.pcb_component_id,
    }),
  ).toHaveLength(3)
  expect(
    circuit.db.pcb_smtpad.list({ pcb_component_id: u2Pcb.pcb_component_id }),
  ).toHaveLength(4)

  expect(j3Pcb.insertion_direction).toBe("from_right")
  expect(u2Pcb.insertion_direction).toBe("from_above")

  const u1Cad = circuit.db.cad_component.getWhere({
    pcb_component_id: u1Pcb.pcb_component_id,
  })
  expect(u1Cad?.footprinter_string).toBe("soic8")
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
})
