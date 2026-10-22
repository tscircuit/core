import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto-layout rotates every custom symbol drawing primitive with its ports", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board schAutoLayoutEnabled>
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />
      <schematicsection name="custom" />
      <diode
        name="D1"
        schSectionName="custom"
        pinLabels={{ pin1: ["pin1"], pin2: ["pin2"] }}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
        symbol={
          <symbol>
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-0.7}
              schY={0}
              schStemLength={0.2}
            />
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={0.7}
              schY={0}
              schStemLength={0.2}
            />
            <schematicpath
              points={[
                { x: -0.5, y: 0 },
                { x: 0.5, y: 0 },
              ]}
            />
            <schematicrect
              schX={-0.2}
              schY={0}
              width={0.3}
              height={0.2}
              strokeWidth={0.02}
              isFilled={false}
            />
            <schematiccircle
              center={{ x: 0.2, y: 0 }}
              radius={0.12}
              strokeWidth={0.02}
              isFilled={false}
            />
            <schematicarc
              center={{ x: 0.2, y: 0 }}
              radius={0.2}
              startAngleDegrees={0}
              endAngleDegrees={90}
              strokeWidth={0.02}
            />
            <schematictext schX={0} schY={0.35} text="D1" fontSize={0.2} />
          </symbol>
        }
      />
      <resistor
        name="R1"
        resistance="10k"
        schSectionName="custom"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component.getWhere({ name: "D1" })!
  const component = circuit.db.schematic_component.getWhere({
    source_component_id: source.source_component_id,
  })!
  const owner = { schematic_component_id: component.schematic_component_id }
  const rect = circuit.db.schematic_rect.list(owner)[0]!
  const circle = circuit.db.schematic_circle.list(owner)[0]!
  const arc = circuit.db.schematic_arc.list(owner)[0]!
  const ports = circuit.db.schematic_port.list(owner)
  const pinMidpoint = {
    x: (ports[0]!.center.x + ports[1]!.center.x) / 2,
    y: (ports[0]!.center.y + ports[1]!.center.y) / 2,
  }
  expect(ports.map((port) => port.facing_direction)).toEqual(["up", "down"])
  expect(rect.center.x).toBeCloseTo(pinMidpoint.x)
  expect(rect.center.y).toBeCloseTo(pinMidpoint.y + 0.2)
  expect(rect.rotation).toBeCloseTo(90)
  expect(circle.center.x).toBeCloseTo(pinMidpoint.x)
  expect(circle.center.y).toBeCloseTo(pinMidpoint.y - 0.2)
  expect(arc.center.x).toBeCloseTo(circle.center.x)
  expect(arc.center.y).toBeCloseTo(circle.center.y)
  expect(arc.start_angle_degrees).toBeCloseTo(90)
  expect(arc.end_angle_degrees).toBeCloseTo(180)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
