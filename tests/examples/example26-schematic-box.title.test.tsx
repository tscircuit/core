import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box component - manual layout for all alignments", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm">
      {/* Row 1: Top Alignments */}
      <schematicbox
        schX={0}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_left (in)"
        titleInside={true}
        titleAlignment="top_left"
      />
      <schematicbox
        schX={6}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_center (in)"
        titleInside={true}
        titleAlignment="top_center"
      />
      <schematicbox
        schX={12}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_right (in)"
        titleInside={true}
        titleAlignment="top_right"
      />
      <schematicbox
        schX={18}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_left (out)"
        titleInside={false}
        titleAlignment="top_left"
      />
      <schematicbox
        schX={24}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_center (out)"
        titleInside={false}
        titleAlignment="top_center"
      />
      <schematicbox
        schX={30}
        schY={0}
        width={3}
        height={3}
        strokeStyle="solid"
        title="top_right (out)"
        titleInside={false}
        titleAlignment="top_right"
      />

      {/* Row 2: Center Alignments */}
      <schematicbox
        schX={0}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_left (in)"
        titleInside={true}
        titleAlignment="center_left"
      />
      <schematicbox
        schX={6}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center (in)"
        titleInside={true}
        titleAlignment="center"
      />
      <schematicbox
        schX={12}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_right (in)"
        titleInside={true}
        titleAlignment="center_right"
      />
      <schematicbox
        schX={18}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_left (out)"
        titleInside={false}
        titleAlignment="center_left"
      />
      <schematicbox
        schX={24}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center (out)"
        titleInside={false}
        titleAlignment="center"
      />
      <schematicbox
        schX={30}
        schY={6}
        width={3}
        height={3}
        strokeStyle="solid"
        title="center_right (out)"
        titleInside={false}
        titleAlignment="center_right"
      />

      {/* Row 3: Bottom Alignments */}
      <schematicbox
        schX={0}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_left (in)"
        titleInside={true}
        titleAlignment="bottom_left"
      />
      <schematicbox
        schX={6}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_center (in)"
        titleInside={true}
        titleAlignment="bottom_center"
      />
      <schematicbox
        schX={12}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_right (in)"
        titleInside={true}
        titleAlignment="bottom_right"
      />
      <schematicbox
        schX={18}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_left (out)"
        titleInside={false}
        titleAlignment="bottom_left"
      />
      <schematicbox
        schX={24}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_center (out)"
        titleInside={false}
        titleAlignment="bottom_center"
      />
      <schematicbox
        schX={30}
        schY={12}
        width={3}
        height={3}
        strokeStyle="solid"
        title="bottom_right (out)"
        titleInside={false}
        titleAlignment="bottom_right"
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
