import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SCHEMATIC_CONNECTION_TOLERANCE_MM = 1e-8

test("custom TVS paths and pin stems stay attached to auto-rotated electrical ports", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board schAutoLayoutEnabled>
      <net name="POGO5" isPowerNet />
      <net name="GND" isGroundNet />
      <schematicsection name="charger" />
      <diode
        name="D2"
        schSectionName="charger"
        pinLabels={{ pin1: ["pin1"], pin2: ["pin2"] }}
        connections={{ pin1: "net.POGO5", pin2: "net.GND" }}
        symbol={
          <symbol>
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-0.5}
              schY={0}
              schStemLength={0.2}
            />
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={0.5}
              schY={0}
              schStemLength={0.2}
            />
            <schematicpath
              points={[
                { x: 0.1, y: 0.1 },
                { x: 0.3, y: 0 },
                { x: 0.1, y: -0.1 },
                { x: 0.1, y: 0.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.1, y: 0.1 },
                { x: -0.3, y: 0 },
                { x: -0.1, y: -0.1 },
                { x: -0.1, y: 0.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.3, y: -0.1 },
                { x: -0.3, y: 0.1 },
                { x: -0.24, y: 0.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0.3, y: 0.1 },
                { x: 0.3, y: -0.1 },
                { x: 0.24, y: -0.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.1, y: 0 },
                { x: 0.1, y: 0 },
              ]}
            />
            <schematictext
              schX={0}
              schY={0.3}
              text="D2"
              fontSize={0.2}
              anchor="bottom_center"
            />
          </symbol>
        }
      />
      <resistor
        name="R1"
        resistance="10k"
        schSectionName="charger"
        connections={{ pin1: "net.POGO5", pin2: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  const source = circuit.db.source_component.getWhere({ name: "D2" })!
  const component = circuit.db.schematic_component.getWhere({
    source_component_id: source.source_component_id,
  })!
  const ports = circuit.db.schematic_port.list({
    schematic_component_id: component.schematic_component_id,
  })
  const stems = circuit.db.schematic_line.list({
    schematic_component_id: component.schematic_component_id,
  })
  const paths = circuit.db.schematic_path.list({
    schematic_component_id: component.schematic_component_id,
  })
  expect(ports).toHaveLength(2)
  expect(stems).toHaveLength(2)
  expect(paths).toHaveLength(5)
  expect(ports.map((port) => port.facing_direction)).toEqual(["up", "down"])
  for (const port of ports) {
    const endpoints = stems.flatMap((line) => [
      { x: line.x1, y: line.y1 },
      { x: line.x2, y: line.y2 },
    ])
    expect(
      Math.min(
        ...endpoints.map((point) =>
          Math.hypot(point.x - port.center.x, point.y - port.center.y),
        ),
      ),
    ).toBeLessThan(SCHEMATIC_CONNECTION_TOLERANCE_MM)
  }
  for (const stem of stems) {
    const points = paths.flatMap((path) => path.points)
    expect(
      Math.min(
        ...points.map((point) =>
          Math.hypot(point.x - stem.x2, point.y - stem.y2),
        ),
      ),
    ).toBeLessThan(SCHEMATIC_CONNECTION_TOLERANCE_MM)
  }
})
