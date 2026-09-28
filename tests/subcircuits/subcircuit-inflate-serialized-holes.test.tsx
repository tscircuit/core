import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("serialized holes retain geometry and ownership when inflated", async () => {
  const { circuit: sourceCircuit } = getTestFixture()
  sourceCircuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <hole diameter={1} pcbX={-6} pcbY={2} />
      <platedhole
        shape="circle"
        outerDiameter={2}
        holeDiameter={1}
        pcbX={-6}
        pcbY={-2}
      />
      <chip
        name="J1"
        pcbX={6}
        pinLabels={{ pin1: ["IN"] }}
        footprint={
          <footprint>
            <hole diameter={1.5} pcbY={2} />
            <platedhole
              portHints={["pin1"]}
              shape="circle"
              outerDiameter={3}
              holeDiameter={1.5}
              pcbY={-2}
            />
          </footprint>
        }
      />
    </board>,
  )
  await sourceCircuit.renderUntilSettled()

  const serializedCircuitJson: CircuitJson = JSON.parse(
    JSON.stringify(sourceCircuit.getCircuitJson()),
  )
  const exportedHoles = serializedCircuitJson.filter(
    (elm) => elm.type === "pcb_hole" || elm.type === "pcb_plated_hole",
  )
  expect(exportedHoles).toHaveLength(4)
  for (const hole of exportedHoles.filter((hole) => hole.x === -6)) {
    expect(hole).not.toHaveProperty("pcb_component_id")
  }

  const { circuit: targetCircuit } = getTestFixture()
  targetCircuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <subcircuit name="Imported" circuitJson={serializedCircuitJson} />
      <pcbnotetext
        text="Serialized holes re-imported"
        pcbY={6.5}
        fontSize={0.8}
      />
      <pcbnotetext text="Board: no owner" pcbX={-6} pcbY={5} fontSize={0.7} />
      <pcbnotetext
        text="Footprint: J1 owner"
        pcbX={6}
        pcbY={5}
        fontSize={0.7}
      />
      <pcbnotetext text="Non-plated" pcbY={2} fontSize={0.6} />
      <pcbnotetext text="Plated" pcbY={-2} fontSize={0.6} />
    </board>,
  )
  await targetCircuit.renderUntilSettled()

  const holes = targetCircuit.db.pcb_hole.list()
  const platedHoles = targetCircuit.db.pcb_plated_hole.list()
  expect({ holes: holes.length, platedHoles: platedHoles.length }).toEqual({
    holes: 2,
    platedHoles: 2,
  })

  const pcbComponents = targetCircuit.db.pcb_component.list()
  expect(pcbComponents).toHaveLength(1)
  for (const [x, holeDiameter, owner] of [
    [-6, 1, undefined],
    [6, 1.5, pcbComponents[0]!.pcb_component_id],
  ] as const) {
    expect(holes.find((hole) => hole.x === x)).toMatchObject({
      hole_shape: "circle",
      x,
      y: 2,
      hole_diameter: holeDiameter,
      pcb_component_id: owner,
    })
    expect(platedHoles.find((hole) => hole.x === x)).toMatchObject({
      shape: "circle",
      x,
      y: -2,
      hole_diameter: holeDiameter,
      outer_diameter: holeDiameter * 2,
      pcb_component_id: owner,
    })
  }

  await expect(targetCircuit).toMatchPcbSnapshot(import.meta.path)
})
