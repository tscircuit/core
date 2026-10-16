import { serve } from "bun"
import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remote routing receives the board via-in-pad policy", async () => {
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
    expect(autorouterInput!.allowViaInPad).toBeUndefined()

    const snapshot = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="200" viewBox="0 0 680 200">
      <rect width="680" height="200" fill="#111827" />
      <g font-family="Arial, sans-serif" fill="#e5e7eb">
        <text x="28" y="38" font-size="23" font-weight="bold">Board via-in-pad policy: remote routing</text>
        <text x="28" y="88" font-size="18">Board permission: true</text>
        <text x="28" y="128" font-size="18">Autorouter override: unspecified</text>
        <text x="28" y="168" font-size="18">SRJ received by HTTP endpoint: ${autorouterInput!.allowViaInPad ?? "absent"}</text>
      </g>
    </svg>`
    await expect(snapshot).toMatchSvgSnapshot(import.meta.path, undefined, {
      diffThresholdPercent: 0.01,
    })
  } finally {
    server.stop(true)
  }
})
