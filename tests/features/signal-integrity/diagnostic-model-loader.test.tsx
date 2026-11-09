import { simulation } from "lib/namespaced-elements"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"

test("SI fails loudly without IBIS bytes or when the host loader fails", async () => {
  for (const platform of [
    undefined,
    {
      platformFetch: Object.assign(
        async () => new Response("missing", { status: 404 }),
        { preconnect() {} },
      ),
    },
    {
      platformFetch: Object.assign(
        async () => {
          throw new Error("unavailable")
        },
        { preconnect() {} },
      ),
    },
  ]) {
    const { circuit } = getTestFixture({ platform })
    circuit.add(
      <DiagnosticBoard>
        <simulation.pcbtransientchannelsimulation
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <simulation.pcbchannel
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
          />
        </simulation.pcbtransientchannelsimulation>
      </DiagnosticBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      platform
        ? "could not load the declared IBIS contents"
        : "configure platformFetch",
    )
    expect(circuit.db.simulation_signal.list()).toHaveLength(0)
  }
})
