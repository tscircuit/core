import { expect, test } from "bun:test"
import type { PcbCopperPour } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("precomputed copper survives cleanup beside a generated pour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={30} height={12}>
      <pcbnotetext
        pcbX={0}
        pcbY={4.5}
        text="ONLY THE PRECOMPUTED POUR SHOULD REMAIN"
        fontSize={0.7}
      />
      <net name="VCC" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-10} />
      <trace from="R1.pin1" to="net.VCC" />
      <copperpour
        connectsTo="net.VCC"
        layer="top"
        outline={[
          { x: -2, y: -2 },
          { x: 2, y: -2 },
          { x: 2, y: 2 },
          { x: -2, y: 2 },
        ]}
      />
      <pcbcopperpour
        shape="polygon"
        connectsTo="net.VCC"
        layer="top"
        points={[
          { x: 7, y: -1 },
          { x: 9, y: -1 },
          { x: 9, y: 1 },
          { x: 7, y: 1 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pours = circuit
    .getCircuitJson()
    .filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
    )
  expect(pours).toHaveLength(1)
  expect(pours[0]?.shape).toBe("polygon")
  expect(pours[0]?.shape === "polygon" ? pours[0].points : []).toEqual([
    { x: 7, y: -1 },
    { x: 9, y: -1 },
    { x: 9, y: 1 },
    { x: 7, y: 1 },
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
