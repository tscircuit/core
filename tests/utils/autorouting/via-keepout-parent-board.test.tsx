import { pcb_board } from "circuit-json"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("nested routing inherits physical board keepouts without leaking another board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board name="A" width={20} height={20} routingDisabled>
      <keepout shape="circle" radius={2} allowTraces />
      <group name="child" subcircuit>
        <resistor name="R1" resistance={1000} footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance={1000} footprint="0402" pcbX={4} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </group>
    </board>,
  )
  circuit.add(
    <board name="B" width={20} height={20} routingDisabled>
      <keepout shape="circle" radius={7} allowTraces />
    </board>,
  )
  await circuit.renderUntilSettled()
  const child = circuit.db.source_group.list().find((g) => g.name === "child")!
  expect(child).toBeDefined()
  for (const normalized of [false, true]) {
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit
        .getCircuitJson()
        .map((item) =>
          normalized && item.type === "pcb_board"
            ? pcb_board.parse(item)
            : item,
        ),
      subcircuit_id: child.subcircuit_id,
    })
    expect(simpleRouteJson.viaKeepouts).toEqual([
      { shape: "circle", center: { x: 0, y: 0 }, radius: 2, layers: ["top"] },
    ])
  }
})
