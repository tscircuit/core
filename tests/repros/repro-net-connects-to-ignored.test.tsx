import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: net connectsTo silently leaves pins disconnected", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={38} height={26} schAutoLayoutEnabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0805"
        pcbX={-5}
        pcbY={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0805" pcbX={5} pcbY={-4} />
      <net name="SIGNAL" connectsTo={[".R1 > .pin1", ".R2 > .pin1"]} />

      <pcbnotetext
        text="BUG: net connectsTo is ignored"
        pcbY={11}
        fontSize={1}
      />
      <pcbnotetext
        text={`<resistor name="R1" resistance="1k"
  footprint="0805" pcbX={-5} pcbY={-4} />
<resistor name="R2" resistance="1k"
  footprint="0805" pcbX={5} pcbY={-4} />
<net name="SIGNAL"
  connectsTo={[".R1 > .pin1", ".R2 > .pin1"]} />`}
        pcbX={-17}
        pcbY={8}
        anchorAlignment="top_left"
        fontSize={0.75}
        color="#ffd166"
      />
      <pcbnotetext
        text="Expected: R1.pin1 and R2.pin1 joined on SIGNAL"
        pcbY={-8}
        fontSize={0.75}
      />
      <pcbnotetext
        text="Actual: no connection is generated"
        pcbY={-10}
        fontSize={0.85}
        color="#ff6b6b"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1100,
    height: 800,
  })
})
