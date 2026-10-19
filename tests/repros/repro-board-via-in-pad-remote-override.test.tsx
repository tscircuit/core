import { serve } from "bun"
import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remote routing explicitly disables board via-in-pad permission", async () => {
  const { circuit } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })
  let autorouterInput: SimpleRouteJson | undefined
  const server = serve({
    port: 0,
    async fetch(request) {
      const body = await request.json()
      autorouterInput = body.input_simple_route_json
      return Response.json({
        autorouting_result: {
          output_simple_route_json: { ...autorouterInput, traces: [] },
        },
      })
    },
  })

  try {
    circuit.add(
      <board
        schematicDisabled
        width="12mm"
        height="8mm"
        isViaInPadAllowed
        autorouter={{
          allowViaInPad: false,
          serverUrl: `http://localhost:${server.port}`,
          serverMode: "solve-endpoint",
          inputFormat: "simplified",
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_board.list()[0].is_via_in_pad_allowed).toBe(true)
    expect(autorouterInput).toBeDefined()
    expect(autorouterInput!.connections).toHaveLength(1)
    expect(autorouterInput!.allowViaInPad).toBe(false)
  } finally {
    server.stop(true)
  }
})
