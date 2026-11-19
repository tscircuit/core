import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved paths cannot join different electrical nets at a crossing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={12} routeRemaining={false} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-4} />
      <testpoint name="B" footprintVariant="pad" pcbX={4} />
      <testpoint name="C" footprintVariant="pad" pcbY={-3} />
      <testpoint name="D" footprintVariant="pad" pcbY={3} />
      <trace from="A.1" to="B.1" routingPhaseIndex={0} />
      <trace from="C.1" to="D.1" routingPhaseIndex={0} />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          {
            connection: "A.1",
            route: [
              { route_type: "wire", x: -4, y: 0, width: 0.25, layer: "top" },
              { route_type: "wire", x: 4, y: 0, width: 0.25, layer: "top" },
            ],
          },
          {
            connection: "C.1",
            route: [
              { route_type: "wire", x: 0, y: -3, width: 0.25, layer: "top" },
              { route_type: "wire", x: 0, y: 3, width: 0.25, layer: "top" },
            ],
          },
        ]}
      />
      <pcbnotetext
        text="Replay rejects crossing A–B and C–D"
        pcbY={5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    { message: 'Saved phase path "A.1" touches a different net' },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
