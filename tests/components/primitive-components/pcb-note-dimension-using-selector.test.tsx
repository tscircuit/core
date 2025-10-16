import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnote dimension using selector is calculated correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="15mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <pcbnotedimension
        from="R1"
        to="R2"
        text="10mm spacing"
        fontSize={1.2}
        color="#00ff00"
      />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
