import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("inflated circuit JSON does not rerun routing DRC", async () => {
  const renderedCircuitJson = await renderToCircuitJson(
    <board width="20mm" height="20mm" placementDrcChecksDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbY={-6}
        pcbRotation={90}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0603"
        pcbY={6}
        pcbRotation={90}
      />
      <trace
        from=".R1 > .pin1"
        to=".R2 > .pin1"
        pcbPath={[
          { x: -5.2, y: 0 },
          { x: 5.2, y: 0 },
        ]}
      />
      <trace
        from=".R3 > .pin1"
        to=".R4 > .pin1"
        pcbPath={[
          { x: 0, y: -5.2 },
          { x: 0, y: 5.2 },
        ]}
      />
    </board>,
  )
  const importedCircuitJson = renderedCircuitJson.filter(
    (element) => !element.type.endsWith("_error"),
  )
  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={importedCircuitJson} />)

  await circuit.renderUntilSettled()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
