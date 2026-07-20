import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro153: circular plated holes with overlapping bounds block autorouting", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm">
      <chip
        name="U1"
        pcbX={-1.6775}
        pcbY={1.27}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              shape="circle"
              holeDiameter={3.81}
              outerDiameter={6.198}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={1.6775}
        pcbY={-1.27}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              shape="circle"
              holeDiameter={1.016}
              outerDiameter={1.88}
            />
          </footprint>
        }
      />
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
      <pcbnotetext pcbY={-4.5} fontSize={0.6} text="CIRCLES DO NOT OVERLAP" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
