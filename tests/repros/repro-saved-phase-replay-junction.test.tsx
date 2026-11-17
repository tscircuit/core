import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("replay rejects a branch ending in the middle of a saved trace", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12} routeRemaining={false} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-4} />
      <testpoint name="B" footprintVariant="pad" pcbX={4} />
      <testpoint name="C" footprintVariant="pad" pcbY={3} />
      <net name="SIGNAL" routingPhaseIndex={0} />
      <trace from="A.1" to="net.SIGNAL" />
      <trace from="B.1" to="net.SIGNAL" />
      <trace from="C.1" to="net.SIGNAL" />
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
              { route_type: "wire", x: 0, y: 3, width: 0.25, layer: "top" },
              { route_type: "wire", x: 0, y: 0, width: 0.25, layer: "top" },
            ],
          },
        ]}
      />
      <pcbnotetext
        text="Saved branch C joins the middle of A–B"
        pcbY={5}
        fontSize={0.4}
      />
      <pcbnotetext text="Replay rejected both paths" pcbY={-3} fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message: expect.stringContaining(
        'Saved phase path "C.1" must end at another connection endpoint',
      ),
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
