import { expect, test } from "bun:test"
import type { CircuitJson, PcbVia } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit circuitJson inflation preserves standalone pcb_via elements", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="10mm" height="10mm">
      <via
        name="V1"
        pcbX="1mm"
        pcbY="2mm"
        holeDiameter="0.4mm"
        outerDiameter="0.8mm"
        fromLayer="top"
        toLayer="inner1"
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceVia = sourceJson.find((elm) => elm.type === "pcb_via") as PcbVia
  expect(sourceVia).toBeDefined()
  expect(sourceVia.layers).toEqual(["top", "inner1"])

  const { circuit: targetCircuit } = getTestFixture()
  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  const targetVias = targetJson.filter(
    (elm) => elm.type === "pcb_via",
  ) as PcbVia[]

  expect(targetErrors).toHaveLength(0)
  expect(targetVias).toHaveLength(1)
  expect(targetVias[0].x).toBe(1)
  expect(targetVias[0].y).toBe(2)
  expect(targetVias[0].hole_diameter).toBe(0.4)
  expect(targetVias[0].outer_diameter).toBe(0.8)
  expect(targetVias[0].from_layer).toBe("top")
  expect(targetVias[0].to_layer).toBe("inner1")
  expect(targetVias[0].layers).toEqual(["top", "inner1"])
})
