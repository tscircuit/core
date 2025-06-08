import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box component - manual 9-point alignment test", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      {/* Title inside */}
      <schematicbox
        schX={0}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_left (in)"
        titleInside={true}
        titleAnchorAlignment="top_left"
      />
      <schematicbox
        schX={4}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_center (in)"
        titleInside={true}
        titleAnchorAlignment="top_center"
      />
      <schematicbox
        schX={8}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_right (in)"
        titleInside={true}
        titleAnchorAlignment="top_right"
      />

      <schematicbox
        schX={0}
        schY={5}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_left (in)"
        titleInside={true}
        titleAnchorAlignment="center_left"
      />
      <schematicbox
        schX={4}
        schY={5}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center (in)"
        titleInside={true}
        titleAnchorAlignment="center"
      />
      <schematicbox
        schX={8}
        schY={5}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_right (in)"
        titleInside={true}
        titleAnchorAlignment="center_right"
      />

      <schematicbox
        schX={0}
        schY={10}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_left (in)"
        titleInside={true}
        titleAnchorAlignment="bottom_left"
      />
      <schematicbox
        schX={4}
        schY={10}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_center (in)"
        titleInside={true}
        titleAnchorAlignment="bottom_center"
      />
      <schematicbox
        schX={8}
        schY={10}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_right (in)"
        titleInside={true}
        titleAnchorAlignment="bottom_right"
      />

      {/* Title outside */}
      <schematicbox
        schX={0}
        schY={16}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_left (out)"
        titleInside={false}
        titleAnchorAlignment="top_left"
      />
      <schematicbox
        schX={4}
        schY={16}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_center (out)"
        titleInside={false}
        titleAnchorAlignment="top_center"
      />
      <schematicbox
        schX={8}
        schY={16}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_right (out)"
        titleInside={false}
        titleAnchorAlignment="top_right"
      />

      <schematicbox
        schX={0}
        schY={21}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_left (out)"
        titleInside={false}
        titleAnchorAlignment="center_left"
      />
      <schematicbox
        schX={4}
        schY={21}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center (out)"
        titleInside={false}
        titleAnchorAlignment="center"
      />
      <schematicbox
        schX={8}
        schY={21}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_right (out)"
        titleInside={false}
        titleAnchorAlignment="center_right"
      />

      <schematicbox
        schX={0}
        schY={26}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_left (out)"
        titleInside={false}
        titleAnchorAlignment="bottom_left"
      />
      <schematicbox
        schX={4}
        schY={26}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_center (out)"
        titleInside={false}
        titleAnchorAlignment="bottom_center"
      />
      <schematicbox
        schX={8}
        schY={26}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_right (out)"
        titleInside={false}
        titleAnchorAlignment="bottom_right"
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
