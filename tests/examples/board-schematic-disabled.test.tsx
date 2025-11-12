import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("<board schematicDisabled> disables schematic rendering while keeping PCB", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10} schematicDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="part-number"
        footprint="ssop28Db"
        schX={0}
        schY={0}
        schWidth={1}
        schHeight={5}
      />
      <diode name="D1" footprint="0805" symbolName="diode" schX={2} schY={1} />
      <trace path={[".D1 > port.right", ".U1 > .pin20"]} />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicComponents = circuitJson.filter(
    (element) => element.type === "schematic_component",
  )
  const schematicTraces = circuitJson.filter(
    (element) => element.type === "schematic_trace",
  )
  const pcbComponents = circuitJson.filter(
    (element) => element.type === "pcb_component",
  )

  expect(schematicComponents.length).toBe(0)
  expect(schematicTraces.length).toBe(0)
  expect(pcbComponents.length).toBeGreaterThan(0)
})
