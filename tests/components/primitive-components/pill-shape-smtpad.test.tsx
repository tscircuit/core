import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Pill-shaped smtpad", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <smtpad
        shape="pill"
        layer="top"
        width={1}
        height={2}
        radius={0.5}
        portHints={["1"]}
        pcbX={2}
      />
      <smtpad
        shape="pill"
        layer="top"
        width={2}
        height={1}
        radius={0.5}
        pcbX={-2}
        portHints={["2"]}
      />
    </footprint>
  )

  circuit.add(
    <board width="7mm" height="3mm">
      <chip name="U1" layer="top" footprint={footprint} />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
