import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a step inside a component's footprint runs with its board, once", async () => {
  const { circuit } = getTestFixture()
  const seen: Array<string | undefined> = []
  circuit.add(
    <board width="16mm" height="10mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
              layer="top"
            />
            <pcbpostroutingstep
              fn={(ctx) => {
                seen.push(ctx.subcircuitId)
              }}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit
    .getCircuitJson()
    .find((e) => e.type === "source_group") as any
  expect(seen).toEqual([board.subcircuit_id])
})
