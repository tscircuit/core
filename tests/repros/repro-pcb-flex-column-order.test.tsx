import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbFlexDirection column order", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="16mm" routingDisabled>
      <group pcbFlex pcbFlexDirection="column" pcbFlexGap="2mm">
        <resistor name="FIRST" resistance="1k" footprint="0603" />
        <resistor name="SECOND" resistance="1k" footprint="0603" />
        <resistor name="THIRD" resistance="1k" footprint="0603" />
      </group>
      <pcbnotetext
        pcbX={0}
        pcbY={7}
        fontSize={0.8}
        text="column: FIRST should be on top"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
