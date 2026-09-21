import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly selectors stay device-scoped and explicit targets override nesting", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group>
      {["left", "right"].map((side, index) => (
        <assembly.device key={side} name={side}>
          <board
            name="B"
            width={20}
            height={20}
            pcbX={index * 40}
            routingDisabled
          >
            <connector
              name="J1"
              pinCount={2}
              footprint="pinrow2"
              pcbX={-5}
              pcbY={0}
              cadModel={null}
            />
            <connector
              name="J2"
              pinCount={2}
              footprint="pinrow2"
              pcbX={5}
              pcbY={0}
              cadModel={null}
            />
          </board>
          <assembly.subassembly name="outer" connectsTo=".J1">
            <assembly.cadassembly
              name={`inner-${side}`}
              connectsTo=".J2"
              cadModel="soic8"
            />
          </assembly.subassembly>
        </assembly.device>
      ))}
    </group>,
  )
  circuit.render()
  for (const [index, side] of ["left", "right"].entries()) {
    const source = circuit.db.source_component
      .list()
      .find((s) => s.name === `inner-${side}`)!
    const cad = circuit.db.cad_component
      .list()
      .find((c) => c.source_component_id === source.source_component_id)!
    const connectorSources = circuit.db.source_component
      .list()
      .filter((s) => s.name === "J2")
    const connector = circuit.db.pcb_component
      .list()
      .find(
        (p) =>
          p.source_component_id === connectorSources[index].source_component_id,
      )!
    expect(cad.position.x).toBeCloseTo(connector.cable_insertion_center!.x)
    expect(cad.position.y).toBeCloseTo(connector.cable_insertion_center!.y)
    expect(cad.position.x).toBeGreaterThan(index * 40)
  }
  expect(circuit.db.cad_component.list()).toHaveLength(2)
})
