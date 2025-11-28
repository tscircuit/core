import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("repro73: circular pad connected to capacitor with straight trace coming out on other side", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <chip
        name="CONN1"
        pcbY={0}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              pcbX="0"
              pcbY="0"
              shape="circle"
              outerDiameter="3mm"
              holeDiameter="2mm"
            />
          </footprint>
        }
      />

      <capacitor
        name="C1"
        capacitance="10uF"
        pcbX={4}
        pcbY={0}
        footprint="0402"
      />

      {/* Straight trace connecting them */}
      <trace
        from=".CONN1 > .1"
        to=".C1 > .pin1"
        pcbStraightLine
        thickness="0.6mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
