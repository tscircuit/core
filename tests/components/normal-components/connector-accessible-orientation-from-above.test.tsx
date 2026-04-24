import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector accessible orientation warning is suppressed for from_above insertion direction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <connector
        name="J1"
        pcbX={0}
        pcbY={9}
        manufacturerPartNumber="TEST"
        pinLabels={{
          pin1: ["A"],
          pin2: ["B"],
        }}
        footprint={
          <footprint insertionDirection="from_above">
            <smtpad
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceConnector = circuit.db.source_component
    .list()
    .find((component) => component.name === "J1")
  const pcbConnector = circuit.db.pcb_component
    .list()
    .find(
      (component) =>
        component.source_component_id === sourceConnector?.source_component_id,
    )

  const warnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_connector_not_in_accessible_orientation_warning",
    )

  expect(pcbConnector?.insertion_direction).toBe("from_above")
  expect(warnings).toHaveLength(0)
})
