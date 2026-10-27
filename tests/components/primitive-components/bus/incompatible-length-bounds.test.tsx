import { expect, test } from "bun:test"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getBusTargetLengthBounds } from "lib/utils/autorouting/getBusTargetLengthBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a bus maximum outside its target window", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={10} routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-10} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={10} />
      <trace name="D0" from="R1.pin1" to="R2.pin1" />
      <bus
        name="DATA"
        connections={["D0"]}
        targetLength="20mm"
        lengthTolerance="1mm"
        maxLength={{ reference: "longest_manhattan", offset: -2 }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(() =>
    getBusTargetLengthBounds(circuit.selectOne("bus") as Bus),
  ).toThrow(
    'Bus "DATA" has incompatible length bounds: minimum 19 mm exceeds maximum 18 mm',
  )
})
