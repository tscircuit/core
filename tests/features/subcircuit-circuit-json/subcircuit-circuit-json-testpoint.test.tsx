import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json: can inflate simple_test_point from circuitJson (Issue #4525)", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="circle"
        padDiameter={1.5}
        pcbX={2}
        pcbY={3}
      />
      <testpoint
        name="TP2"
        footprintVariant="through_hole"
        holeDiameter={0.8}
        pcbX={-2}
        pcbY={-3}
      />
    </group>,
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const tp1 = circuitJson.find(
    (element: any) =>
      element.type === "source_component" &&
      element.ftype === "simple_test_point" &&
      element.name === "TP1",
  ) as any

  expect(tp1).toBeDefined()
  expect(tp1?.footprint_variant).toBe("pad")
  expect(tp1?.pad_diameter).toBe(1.5)

  const tp2 = circuitJson.find(
    (element: any) =>
      element.type === "source_component" &&
      element.ftype === "simple_test_point" &&
      element.name === "TP2",
  ) as any

  expect(tp2).toBeDefined()
  expect(tp2?.footprint_variant).toBe("through_hole")
  expect(tp2?.hole_diameter).toBe(0.8)
})
