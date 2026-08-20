import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair exact trace name disambiguates a shared connectivity key", async () => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined
  let autorouterInput: SimpleRouteJson | undefined
  const autorouter = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      autorouterInput = structuredClone(simpleRouteJson)
      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => ({
          type: "pcb_trace",
          pcb_trace_id: `${connection.name}_routed`,
          connection_name: connection.source_trace_id ?? connection.name,
          source_trace_id: connection.source_trace_id,
          route: connection.pointsToConnect.map((point) => ({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: connection.nominalTraceWidth ?? 0.15,
            layer: point.layer,
          })),
        }),
      )
    },
  )

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board
      width="24mm"
      height="14mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: autorouter,
      }}
    >
      <resistor name="P1" resistance="1k" footprint="0402" pcbX={-8} pcbY={2} />
      <resistor name="P2" resistance="1k" footprint="0402" pcbX={0} pcbY={2} />
      <resistor name="P3" resistance="1k" footprint="0402" pcbX={8} pcbY={2} />
      <resistor
        name="N1"
        resistance="1k"
        footprint="0402"
        pcbX={-8}
        pcbY={-2}
      />
      <resistor name="N2" resistance="1k" footprint="0402" pcbX={0} pcbY={-2} />
      <trace name="USB_P" from=".P1 > .pin1" to=".P2 > .pin1" />
      <trace name="USB_P_TAP" from=".P2 > .pin1" to=".P3 > .pin1" />
      <trace name="USB_N" from=".N1 > .pin1" to=".N2 > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toBeUndefined()
  expect(autorouterInput?.differentialPairs).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
