import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon, pill and rotated pill smtpad solder paste", async () => {
  const { circuit } = getTestFixture()

  const lShape = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ]

  circuit.add(
    <board width="16mm" height="8mm" routingDisabled>
      <chip
        name="U1"
        pcbX={-5}
        footprint={
          <footprint>
            <smtpad shape="polygon" points={lShape} portHints={["1"]} />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={0}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="2mm"
              height="1.2mm"
              radius="0.6mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
      <chip
        name="U3"
        pcbX={5}
        pcbRotation={30}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="2mm"
              height="1.2mm"
              radius="0.6mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
