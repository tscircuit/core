import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbAlignItems start in a row", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="16mm" routingDisabled>
      <group
        pcbFlex
        pcbFlexDirection="row"
        pcbAlignItems="start"
        pcbFlexGap="1mm"
      >
        <resistor name="SMALL" resistance="1k" footprint="0402" />
        <resistor name="TALL" resistance="1k" footprint="1210" />
      </group>
      <pcbnotetext
        pcbX={0}
        pcbY={7}
        fontSize={0.8}
        text="alignItems start: top edges should line up"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
