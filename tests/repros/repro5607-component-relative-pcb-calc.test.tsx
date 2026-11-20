import { expect, test } from "bun:test"
import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro5607: component-relative and pin-relative pcbX/pcbY calc does not emit unsupported footprint errors", async () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })

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
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX="calc(board.minX + 3mm)"
        pcbY={-6}
      />
      <group name="G1">
        <resistor
          name="R2"
          resistance="1k"
          footprint="0603"
          pcbLeftEdgeX="calc(U1.maxX + 2mm)"
          pcbY="calc(U1.y)"
        />
        <chip
          name="U2"
          footprint="soic8"
          pcbX="calc(R2.maxX + 5mm)"
          pcbY="calc(R2.y)"
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()

  const getPcbComponent = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((component) => component.name === name)!
    return circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
  }

  const chip = getPcbComponent("U1")
  const pin1 = circuit.db.pcb_smtpad
    .list({ pcb_component_id: chip.pcb_component_id })
    .find((pad) => pad.port_hints?.includes("1"))!
  const pin1Bounds = getBoundsOfPcbElements([pin1])
  const pin1Center = {
    x: (pin1Bounds.minX + pin1Bounds.maxX) / 2,
    y: (pin1Bounds.minY + pin1Bounds.maxY) / 2,
  }

  const c1 = getPcbComponent("C1")
  const r1 = getPcbComponent("R1")
  const r2 = getPcbComponent("R2")
  const u2 = getPcbComponent("U2")

  expect(c1.center.x).toBeCloseTo(pin1Center.x - 2)
  expect(c1.center.y).toBeCloseTo(pin1Center.y)
  expect(r1.center.x).toBeCloseTo(-17)
  expect(r1.center.y).toBeCloseTo(-6)
  expect(r2.center.x).toBeCloseTo(
    chip.center.x + (chip.width ?? 0) / 2 + 2 + (r2.width ?? 0) / 2,
  )
  expect(r2.center.y).toBeCloseTo(chip.center.y)
  expect(u2.center.x).toBeCloseTo(r2.center.x + (r2.width ?? 0) / 2 + 5)
  expect(u2.center.y).toBeCloseTo(r2.center.y)

  const errors = json.filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual([])
})
