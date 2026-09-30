import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace hints stay with a net-owned autorouter connection", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  let autorouterInput: SimpleRouteJson | undefined

  circuit.add(
    <board
      width="16mm"
      height="10mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          autorouterInput = simpleRouteJson
          return []
        }),
      }}
    >
      <testpoint name="TP1" pcbX={-5} pcbY={0} />
      <testpoint name="TP2" pcbX={0} pcbY={0} />
      <testpoint name="TP3" pcbX={5} pcbY={0} />
      <net name="SIGNAL" />
      <trace
        path={[".TP1 > .pin1", ".TP2 > .pin1", ".TP3 > .pin1", "net.SIGNAL"]}
      />
      <tracehint for=".TP1 > .pin1" offset={{ x: 0, y: 3 }} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autorouterInput?.connections).toHaveLength(1)
  expect(autorouterInput?.connections[0].source_trace_id).toBeUndefined()
  expect(autorouterInput?.connections[0].pointsToConnect).toContainEqual({
    x: 0,
    y: 3,
    layer: "top",
  })
})
