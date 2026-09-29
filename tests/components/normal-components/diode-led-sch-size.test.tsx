import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode and LED compact symbols retain pin spans and polarity in every orientation", () => {
  const { circuit } = getTestFixture()
  const families = ["standard", "avalanche", "zener", "led"] as const
  const sizes = ["sm", "xs"] as const
  const orientations = ["right", "up", "left", "down"] as const

  circuit.add(
    <board width="30mm" height="30mm">
      {families.flatMap((family, row) =>
        sizes.flatMap((schSize, sizeRow) =>
          orientations.map((schOrientation, col) => {
            const props = {
              name: `${family}_${schSize}_${schOrientation}`,
              schSize,
              schRotation: col * 90,
              schX: col * 3,
              schY: -(row * 2 + sizeRow) * 2,
            }
            return family === "led" ? (
              <led key={props.name} {...props} />
            ) : (
              <diode key={props.name} {...props} variant={family} />
            )
          }),
        ),
      )}
    </board>,
  )
  circuit.render()

  expect(circuit.db.source_component.list()).toHaveLength(32)
  for (const sourceComponent of circuit.db.source_component.list()) {
    const schematicComponent = circuit.db.schematic_component
      .list()
      .find(
        (component) =>
          component.source_component_id === sourceComponent.source_component_id,
      )!
    const [family, size, orientation] = sourceComponent.name.split("_")
    const base =
      family === "standard"
        ? "diode"
        : family === "led"
          ? "led"
          : `${family}_diode`
    expect(schematicComponent.symbol_name).toBe(
      `${base}_${size}_${orientation}`,
    )
    const ports = circuit.db.schematic_port
      .list()
      .filter(
        (port) =>
          port.schematic_component_id ===
          schematicComponent.schematic_component_id,
      )
    const anodeSource = circuit.db.source_port
      .list()
      .find(
        (port) =>
          port.source_component_id === sourceComponent.source_component_id &&
          port.pin_number === 1,
      )!
    const anode = ports.find(
      (port) => port.source_port_id === anodeSource.source_port_id,
    )!
    const cathode = ports.find(
      (port) => port.source_port_id !== anodeSource.source_port_id,
    )!
    expect(ports).toHaveLength(2)
    expect(
      Math.hypot(
        cathode.center.x - anode.center.x,
        cathode.center.y - anode.center.y,
      ),
    ).toBeCloseTo(size === "sm" ? 0.5 : 0.35, 10)
    const delta =
      orientation === "right" || orientation === "left"
        ? cathode.center.x - anode.center.x
        : cathode.center.y - anode.center.y
    expect(Math.sign(delta)).toBe(
      orientation === "right" || orientation === "up" ? 1 : -1,
    )
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
