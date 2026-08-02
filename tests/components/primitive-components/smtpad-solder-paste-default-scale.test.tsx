import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("default behaviour without any paste props stays 0.7", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        layer="top"
        portHints={[]}
        pcbX={-3}
      />
      <smtpad shape="circle" radius={0.5} layer="top" portHints={[]} pcbX={3} />
    </board>,
  )
  circuit.render()

  const pastes = circuit.db.pcb_solder_paste.list()
  const rectPaste = pastes.find((p) => p.shape === "rect")
  const circlePaste = pastes.find((p) => p.shape === "circle")
  if (rectPaste?.shape === "rect") {
    expect(rectPaste.width).toBeCloseTo(2 * 0.7)
    expect(rectPaste.height).toBeCloseTo(1 * 0.7)
  } else {
    throw new Error("Expected rect solder paste")
  }
  if (circlePaste?.shape === "circle") {
    expect(circlePaste.radius).toBeCloseTo(0.5 * 0.7)
  } else {
    throw new Error("Expected circle solder paste")
  }
})
