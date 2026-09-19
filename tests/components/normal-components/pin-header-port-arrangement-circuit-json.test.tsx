import { expect, test } from "bun:test"
import {
  type AnyCircuitElement,
  type SchematicComponent,
  type SourceSimplePinHeader,
  any_circuit_element,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type SidesPortArrangement = {
  left_side?: { pins: number[]; direction?: string }
  right_side?: { pins: number[]; direction?: string }
  top_side?: { pins: number[]; direction?: string }
  bottom_side?: { pins: number[]; direction?: string }
}

test("pinheader emits numeric pins in schematic port_arrangement and satisfies Circuit JSON schema", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader name="J1" pinCount={2} footprint="pinrow2" />
    </board>,
  )

  circuit.render()

  const sc = circuit
    .getCircuitJson()
    .find(
      (element): element is SchematicComponent =>
        element.type === "schematic_component",
    )

  expect(sc).toBeDefined()
  expect(sc?.port_arrangement).toBeDefined()
  const portArrangement = sc?.port_arrangement as SidesPortArrangement
  expect(portArrangement?.right_side?.pins).toEqual([1, 2])

  const anyElementResult = any_circuit_element.safeParse(sc)
  expect(anyElementResult.success).toBe(true)
})

test("pinheader respects facing directions with numeric pins in port_arrangement", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <pinheader
        name="J_LEFT"
        pinCount={3}
        footprint="pinrow3"
        facingDirection="left"
        schX={-5}
      />
      <pinheader
        name="J_UP"
        pinCount={3}
        footprint="pinrow3"
        schFacingDirection="up"
        schY={5}
      />
      <pinheader
        name="J_DOWN"
        pinCount={3}
        footprint="pinrow3"
        schFacingDirection="down"
        schY={-5}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const findSourceComponentId = (name: string) =>
    circuitJson.find(
      (s): s is SourceSimplePinHeader =>
        s.type === "source_component" &&
        "name" in s &&
        (s as any).name === name,
    )?.source_component_id

  const leftSc = circuitJson.find(
    (e): e is SchematicComponent =>
      e.type === "schematic_component" &&
      e.source_component_id === findSourceComponentId("J_LEFT"),
  )!
  const upSc = circuitJson.find(
    (e): e is SchematicComponent =>
      e.type === "schematic_component" &&
      e.source_component_id === findSourceComponentId("J_UP"),
  )!
  const downSc = circuitJson.find(
    (e): e is SchematicComponent =>
      e.type === "schematic_component" &&
      e.source_component_id === findSourceComponentId("J_DOWN"),
  )!

  const leftArrangement = leftSc.port_arrangement as SidesPortArrangement
  const upArrangement = upSc.port_arrangement as SidesPortArrangement
  const downArrangement = downSc.port_arrangement as SidesPortArrangement

  expect(leftArrangement?.left_side?.pins).toEqual([1, 2, 3])
  expect(any_circuit_element.safeParse(leftSc).success).toBe(true)

  expect(upArrangement?.top_side?.pins).toEqual([1, 2, 3])
  expect(any_circuit_element.safeParse(upSc).success).toBe(true)

  expect(downArrangement?.bottom_side?.pins).toEqual([1, 2, 3])
  expect(any_circuit_element.safeParse(downSc).success).toBe(true)
})

test("pinheader normalizes string pin labels in schPinArrangement", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader
        name="J_CUSTOM"
        pinCount={2}
        footprint="pinrow2"
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
        }}
      />
    </board>,
  )

  circuit.render()

  const sc = circuit
    .getCircuitJson()
    .find((e): e is SchematicComponent => e.type === "schematic_component")!

  const portArrangement = sc.port_arrangement as SidesPortArrangement
  expect(portArrangement?.right_side?.pins).toEqual([1, 2])
  expect(any_circuit_element.safeParse(sc).success).toBe(true)
})
