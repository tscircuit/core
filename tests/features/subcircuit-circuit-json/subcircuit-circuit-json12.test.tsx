import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json12 - visualizes circuitJson subcircuit pcbAnchorAlignment", async () => {
  const { circuit } = getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={2} />
    </group>,
  )

  circuit.add(
    <board width="30mm" height="30mm">
      <silkscreenpath
        route={[
          { x: 9, y: 15 },
          { x: 11, y: 15 },
        ]}
        strokeWidth={0.15}
      />
      <silkscreenpath
        route={[
          { x: 10, y: 14 },
          { x: 10, y: 16 },
        ]}
        strokeWidth={0.15}
      />
      <silkscreentext
        pcbX={10}
        pcbY={16.5}
        text="expected top_left anchor"
        fontSize={0.8}
        anchorAlignment="top_center"
      />
      <subcircuit
        name="S1"
        circuitJson={subcircuitCircuitJson}
        pcbX={10}
        pcbY={15}
        pcbAnchorAlignment="top_left"
      />
    </board>,
  )

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
    showPcbGroups: true,
  })
})
