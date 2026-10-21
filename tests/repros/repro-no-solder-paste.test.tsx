import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("noSolderPaste omits paste without covering the copper pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={8}>
      <smtpad shape="circle" radius={1.2} pcbX={-3} portHints={[]} />
      <smtpad
        shape="circle"
        radius={1.2}
        pcbX={3}
        portHints={[]}
        noSolderPaste
      />
      <silkscreentext text="PASTE" pcbX={-3} pcbY={2.5} fontSize={0.6} />
      <silkscreentext text="NO PASTE" pcbX={3} pcbY={2.5} fontSize={0.6} />
    </board>,
  )
  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
