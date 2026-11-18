import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board autorouter receives net trace clearance in its SRJ input", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined
  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    autorouterInput = simpleRouteJson
  })
  circuit.add(
    <board
      width={12}
      height={8}
      schematicDisabled
      minTraceToPadEdgeClearance={0.1}
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <net
        name="USB"
        minTraceClearance="0.15mm"
        connectsTo={["R1.pin2", "R2.pin1"]}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceNet = circuit.db.source_net.getWhere({ name: "USB" })!
  expect(autorouterInput?.connections).toHaveLength(1)
  expect(autorouterInput?.connections[0].minTraceClearance).toBe(0.15)
  expect(autorouterInput?.minTraceToPadEdgeClearance).toBe(0.1)
  expect(
    autorouterInput?.obstacles
      .filter((obstacle) =>
        obstacle.connectedTo.includes(sourceNet.source_net_id),
      )
      .map((obstacle) => obstacle.minTraceClearance),
  ).toEqual([0.15, 0.15])
})
