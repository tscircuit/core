import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smtpad solder paste config", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="8mm">
      <smtpad
        shape="rect"
        width={2}
        height={1.4}
        layer="top"
        portHints={[]}
        pcbX={-6}
      />
      <smtpad
        shape="rect"
        width={2}
        height={1.4}
        solderPasteMargin={0}
        layer="top"
        portHints={[]}
        pcbX={-2}
      />
      <smtpad
        shape="rect"
        width={2}
        height={1.4}
        solderPasteMargin={-0.2}
        layer="top"
        portHints={[]}
        pcbX={2}
      />
      <smtpad
        shape="rect"
        width={2}
        height={1.4}
        solderPasteMargin={0.2}
        layer="top"
        portHints={[]}
        pcbX={6}
      />
    </board>,
  )
  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
