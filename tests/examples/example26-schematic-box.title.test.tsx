import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematicbox
        strokeStyle="dashed"
        width={2}
        height={1}
        schX={3}
        schY={1}
        title="Title Default (inside)"
        titleInside={true}
      />

      {/* Additional tests: title in/out, up/down/left/right */}
      <schematicbox
        strokeStyle="dashed"
        width={2}
        height={1}
        schX={0}
        schY={3}
        title="Top Left (inside)"
        titleInside={true}
        titleAnchorPosition={{ x: -0.3, y: 0.3 }}
      />
      <schematicbox
        strokeStyle="dashed"
        width={2}
        height={1}
        schX={3}
        schY={3}
        title="Top Right (inside)"
        titleAnchorAlignment="top_right"
        titleInside={true}
        titleAnchorPosition={{ x: 0.9, y: 0.4 }}
      />
      <schematicbox
        strokeStyle="dashed"
        width={2}
        height={1}
        schX={6}
        schY={3}
        title="Bottom Left (inside)"
        titleAnchorAlignment="bottom_left"
        titleInside={true}
        titleAnchorPosition={{ x: -0.9, y: -0.4 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={0}
        schY={5}
        title="Bottom Right (inside)"
        titleInside={true}
        titleAnchorAlignment="bottom_right"
        titleAnchorPosition={{ x: 0.9, y: -0.4 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={3}
        schY={5}
        title="Title Left (outside)"
        titleInside={false}
        titleAnchorPosition={{ x: -0.2, y: 0 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={6}
        schY={5}
        title="Title Right (outside)"
        titleInside={false}
        titleAnchorPosition={{ x: 1.2, y: 0 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={0}
        schY={7}
        title="Title Above (outside)"
        titleInside={false}
        titleAnchorPosition={{ x: 0, y: 0.2 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={3}
        schY={7}
        title="Title Below (outside)"
        titleInside={false}
        titleAnchorPosition={{ x: 0, y: -1.3 }}
      />
      <schematicbox
        strokeStyle="solid"
        width={2}
        height={1}
        schX={6}
        schY={7}
        title="Title Default (outside)"
        titleInside={false}
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
