import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor polarized", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10µF"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        polarized
        connections={{
          pos: "net.POS",
          neg: "net.NEG",
        }}
      />
      <capacitor
        name="C2"
        capacitance="10µF"
        footprint="0402"
        schX={5}
        schRotation="90deg"
        polarized
        connections={{
          pos: "net.POS",
          neg: "net.NEG",
        }}
      />
      <capacitor
        name="C3"
        capacitance="10µF"
        footprint="0402"
        schX={10}
        schRotation="180deg"
        polarized
        connections={{
          pos: "net.POS",
          neg: "net.NEG",
        }}
      />
      <capacitor
        name="C4"
        capacitance="10µF"
        footprint="0402"
        schX={15}
        schRotation="270deg"
        polarized
        connections={{
          pos: "net.POS",
          neg: "net.NEG",
        }}
      />

      <capacitor
        name="C5"
        capacitance="10µF"
        footprint="0402"
        schY={5}
        polarized
        connections={{
          pin1: "net.POS",
          pin2: "net.NEG",
        }}
      />
      <capacitor
        name="C6"
        capacitance="10µF"
        footprint="0402"
        schX={5}
        schY={5}
        schRotation="90deg"
        polarized
        connections={{
          pin1: "net.POS",
          pin2: "net.NEG",
        }}
      />
      <capacitor
        name="C7"
        capacitance="10µF"
        footprint="0402"
        schX={10}
        schY={5}
        schRotation="180deg"
        polarized
        connections={{
          pin1: "net.POS",
          pin2: "net.NEG",
        }}
      />
      <capacitor
        name="C8"
        capacitance="10µF"
        footprint="0402"
        schX={15}
        schY={5}
        schRotation="270deg"
        polarized
        connections={{
          pin1: "net.POS",
          pin2: "net.NEG",
        }}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
  }>

  expect(capacitors[0].display_capacitance).toBe("10µF")
  expect(project).toMatchSchematicSnapshot(import.meta.path)

  const source_port1 = project.db.source_port.list({
    name: "pin1",
  })[0]

  const source_port2 = project.db.source_port.list({
    name: "pin2",
  })[0]

  const pcb_port1 = project.db.pcb_port.list({
    source_port_id: source_port1.source_port_id,
  })[0]

  const pcb_port2 = project.db.pcb_port.list({
    source_port_id: source_port2.source_port_id,
  })[0]

  // pin1 is on the left side of pin2
  expect(pcb_port1.x).toBeLessThan(pcb_port2.x)
})
