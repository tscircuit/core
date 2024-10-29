import { test, expect } from "bun:test"
import { serve } from "bun"
import { getTestFixture } from "../fixtures/get-test-fixture"

// This test uses the board autorouter={{ serverUrl: "http://..." }} prop to
// test the remote autorouter
test("remote autorouter", async () => {
  // Start up a local autorouting server
  // TODO this should be a module (maybe exported from core)
  const autorouteServer = serve({
    fetch(req) {
      // Accept POST requests with JSON body containing either { simple_route_json } or { circuit_json } or { specctra_dsn }
      return new Response(
        JSON.stringify({
          workd: "wtvr",
        }),
      )
    },
  })

  const { circuit } = getTestFixture()

  // Create a basic circuit that needs routing
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      // @ts-ignore
      autorouter={{
        serverUrl: "http://localhost:3000/autoroute",
      }}
    >
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify routing request was made
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
