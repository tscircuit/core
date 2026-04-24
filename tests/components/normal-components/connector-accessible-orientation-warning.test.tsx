import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector emits accessible orientation warning when facing away from nearest board edge", async () => {
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
          <footprint insertionDirection="from_back">
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

  const warnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_connector_not_in_accessible_orientation_warning",
    )

  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toMatchInlineSnapshot(
    `"component is facing y- but should face y+ so the connector is accessible from the board edge"`,
  )
})
