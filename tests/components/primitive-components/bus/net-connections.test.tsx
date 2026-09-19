import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("bus port selectors resolve traces connected through named nets", async () => {
  const { circuit } = getTestFixture()
  const asyncErrors: string[] = []
  let routedBuses: SimpleRouteJson["buses"]
  circuit.on("asyncEffect:end", ({ error }) => {
    if (error) asyncErrors.push(error)
  })
  const board = (errorMessage?: string) => (
    <board
      width={44}
      height={32}
      schematicDisabled
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj: SimpleRouteJson) => {
          routedBuses = srj.buses
          return srj.connections.map((connection, i) => ({
            type: "pcb_trace",
            pcb_trace_id: `net_route_${i}`,
            connection_name: connection.name,
            route: connection.pointsToConnect.map((point) => ({
              route_type: "wire" as const,
              x: point.x,
              y: point.y,
              width: 0.35,
              layer: "top",
            })),
          }))
        }),
      }}
    >
      <net name="D0" />
      <net name="D1" />
      <LengthTestTerminal name="TX0" x={-10} y={3} />
      <LengthTestTerminal name="RX0" x={10} y={3} />
      <LengthTestTerminal name="TX1" x={-12} y={-3} />
      <LengthTestTerminal name="RX1" x={12} y={-3} />
      <trace from=".TX0 > .pin1" to="net.D0" />
      <trace from=".RX0 > .pin1" to="net.D0" />
      <trace from=".TX1 > .pin1" to="net.D1" />
      <trace from=".RX1 > .pin1" to="net.D1" />
      <bus
        name="DATA"
        connections={[".TX0 > .pin1", ".TX1 > .pin1"]}
        maxLengthSkew="2mm"
      />
      <pcbnotetext
        text={
          '<trace from=".TX0 > .pin1" to="net.D0" />\n<trace from=".RX0 > .pin1" to="net.D0" />\n<bus name="DATA" maxLengthSkew="2mm"\n  connections={[".TX0 > .pin1", ".TX1 > .pin1"]} />'
        }
        pcbX={-17}
        pcbY={13}
        anchorAlignment="top_left"
        fontSize={0.85}
        color="#ffd166"
      />
      <pcbnotetext text="D0: 20 mm through net.D0" pcbY={5} fontSize={1} />
      <pcbnotetext text="D1: 24 mm through net.D1" pcbY={-1} fontSize={1} />
      <pcbnotetext
        text="Skew = 24 - 20 = 4 mm > 2 mm allowed"
        pcbY={-7}
        fontSize={1}
        color="#ff6b6b"
      />
      {errorMessage && (
        <pcbnotetext
          text={`DRC: ${errorMessage.replace(", ", ",\n")}`}
          pcbX={-16}
          pcbY={-10}
          anchorAlignment="top_left"
          fontSize={0.85}
          color="#ff6b6b"
        />
      )}
    </board>
  )
  circuit.add(board())
  await circuit.renderUntilSettled()
  expect(asyncErrors).toEqual([])
  expect(routedBuses).toEqual([
    {
      busId: "DATA",
      name: "DATA",
      connectionNames: circuit.db.source_net
        .list()
        .map((net) => net.source_net_id),
      maxLengthSkew: 2,
    },
  ])
  const errors = circuit.db.pcb_bus_length_skew_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    actual_length_skew: 4,
    maximum_length_skew: 2,
  })
  const { circuit: annotated } = getTestFixture()
  annotated.add(board(errors[0].message))
  await annotated.renderUntilSettled()
  expect(annotated.db.pcb_bus_length_skew_error.list()).toEqual(errors)
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 800,
  })
})
