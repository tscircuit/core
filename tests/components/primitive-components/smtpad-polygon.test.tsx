import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("renders polygon-shaped smtpad with correct group positioning", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <smtpad
        shape="polygon"
        points={[
          { x: -0.5, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: 0 },
          { x: 0, y: -0.5 },
          { x: -0.5, y: -0.5 },
        ]}
        portHints={["1"]}
      />
    </footprint>
  )

  circuit.add(
    <board width="7mm" height="3mm">
      <group name="G1" pcbX={2}>
        <chip name="U2" layer="top" footprint={footprint} />
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
