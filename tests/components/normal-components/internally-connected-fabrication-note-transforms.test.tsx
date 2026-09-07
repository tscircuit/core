import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const cases: Array<{
  name: string
  pcbX: number
  pcbY: number
  pcbRotation: number
  layer: "top" | "bottom"
}> = [
  { name: "U0_TOP", pcbX: -5, pcbY: 2, pcbRotation: 0, layer: "top" },
  {
    name: "U90_BOTTOM",
    pcbX: 0,
    pcbY: 2,
    pcbRotation: 90,
    layer: "bottom",
  },
  {
    name: "U180_TOP",
    pcbX: -5,
    pcbY: -2,
    pcbRotation: 180,
    layer: "top",
  },
  {
    name: "U270_BOTTOM",
    pcbX: 0,
    pcbY: -2,
    pcbRotation: 270,
    layer: "bottom",
  },
]

test("internal connection fabrication notes follow component rotations and layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="9mm">
      <pcbnotetext
        text="0° TOP / 90° BOTTOM / 180° TOP / 270° BOTTOM"
        pcbY={3.8}
        fontSize={0.2}
      />
      {cases.map(({ name, pcbX, pcbY, pcbRotation, layer }) => (
        <chip
          key={name}
          name={name}
          pcbX={pcbX}
          pcbY={pcbY}
          pcbRotation={pcbRotation}
          layer={layer}
          pinLabels={{ pin1: "A", pin2: "B" }}
          internallyConnectedPins={[["pin1", "pin2"]]}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={0.8}
                height={0.8}
                pcbX={-1.5}
                pcbY={-0.5}
                portHints={["pin1"]}
              />
              <smtpad
                shape="rect"
                width={0.8}
                height={0.8}
                pcbX={1.5}
                pcbY={0.5}
                portHints={["pin2"]}
              />
            </footprint>
          }
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const { name, layer } of cases) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const internalConnection =
      circuit.db.source_component_internal_connection.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })!
    const connectedPadCenters = circuit.db.pcb_port
      .list()
      .filter((pcbPort) =>
        internalConnection.source_port_ids.includes(pcbPort.source_port_id),
      )
      .map(({ x, y }) => `${x},${y}`)
      .toSorted()
    const fabricationNotePath = circuit.db.pcb_fabrication_note_path.getWhere({
      pcb_component_id: pcbComponent.pcb_component_id,
    })!

    expect(fabricationNotePath.layer).toBe(layer)
    expect(
      fabricationNotePath.route.map(({ x, y }) => `${x},${y}`).toSorted(),
    ).toEqual(connectedPadCenters)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
