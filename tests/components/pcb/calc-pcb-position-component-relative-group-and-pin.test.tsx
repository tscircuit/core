import { expect, test } from "bun:test"
import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component-relative pcb calc emits no invalid property errors for normal components including inside groups", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbRotation={90}
        pcbX="calc(U1.pin1.x - 2mm)"
        pcbY="calc(U1.pin1.y)"
      />
      <group>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbLeftEdgeX="calc(U1.maxX + 2mm)"
          pcbY="calc(U1.y)"
        />
      </group>
      <pcbnotetext
        pcbX={0}
        pcbY={-11}
        text="C1 left of U1.pin1, R1 right of U1"
        fontSize={1.2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toHaveLength(0)
  expect(
    circuit.db.source_invalid_component_property_error.list(),
  ).toHaveLength(0)

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()

  const getPcbComponentByName = (name: string) => {
    const sourceComponent = sourceComponents.find(
      (component) => component.name === name,
    )
    return pcbComponents.find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )
  }

  const u1 = getPcbComponentByName("U1")
  const c1 = getPcbComponentByName("C1")
  const r1 = getPcbComponentByName("R1")

  expect(u1).toBeDefined()
  expect(c1).toBeDefined()
  expect(r1).toBeDefined()

  const u1Pin1Pad = circuit.db.pcb_smtpad
    .list({ pcb_component_id: u1!.pcb_component_id })
    .find((pad) => pad.port_hints?.includes("1"))

  expect(u1Pin1Pad).toBeDefined()

  const pin1Bounds = getBoundsOfPcbElements([u1Pin1Pad!])
  const pin1CenterX = (pin1Bounds.minX + pin1Bounds.maxX) / 2
  const pin1CenterY = (pin1Bounds.minY + pin1Bounds.maxY) / 2

  expect(c1!.center.x).toBeCloseTo(pin1CenterX - 2)
  expect(c1!.center.y).toBeCloseTo(pin1CenterY)
  expect(r1!.center.x).toBeCloseTo(
    u1!.center.x + (u1!.width ?? 0) / 2 + 2 + (r1!.width ?? 0) / 2,
  )
  expect(r1!.center.y).toBeCloseTo(u1!.center.y)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
