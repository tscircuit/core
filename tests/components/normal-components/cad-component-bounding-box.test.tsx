import { expect, it } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("does not emit a bounding-box cad_component when a cad_component already exists", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_component")

  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0]).toMatchObject({
    type: "cad_component",
    footprinter_string: "soic8",
  })
  expect(cadComponents[0]).not.toHaveProperty("show_as_bounding_box")
})

it("emits a bounding-box cad_component when no cad_component exists", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const cadComponents = circuitJson.filter(
    (element) => element.type === "cad_component",
  )

  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0]).toMatchObject({
    type: "cad_component",
    pcb_component_id: expect.any(String),
    source_component_id: expect.any(String),
    position: { x: 0, y: 0, z: 0.7 },
    show_as_bounding_box: true,
  })
  expect(cadComponents[0]).not.toHaveProperty("footprinter_string")
})

it("does not emit a bounding-box cad_component when cadModel is null", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" cadModel={null} />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_component")

  expect(cadComponents).toHaveLength(0)
})

it("does not emit a bounding-box cad_component for wrappers with cadModel null", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="Xpattern1" noSchematicRepresentation cadModel={null}>
        <footprint>
          <hole shape="pill" pcbX={0} pcbY={0} width={2} height={1} />
        </footprint>
      </chip>
    </board>,
  )

  circuit.render()

  const cadComponents = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_component")

  expect(cadComponents).toHaveLength(0)
})
