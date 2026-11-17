import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("replay restores a saved trunk with junctions at both ends", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12} routeRemaining={false} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-4} pcbY={-2} />
      <testpoint name="B" footprintVariant="pad" pcbX={4} pcbY={-2} />
      <testpoint name="C" footprintVariant="pad" pcbX={-4} pcbY={2} />
      <testpoint name="D" footprintVariant="pad" pcbX={4} pcbY={2} />
      <net name="SIGNAL" routingPhaseIndex={0} />
      <trace from="A.1" to="net.SIGNAL" />
      <trace from="B.1" to="net.SIGNAL" />
      <trace from="C.1" to="net.SIGNAL" />
      <trace from="D.1" to="net.SIGNAL" />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          {
            connection: "A.1",
            route: [
              { route_type: "wire", x: -4, y: -2, width: 0.25, layer: "top" },
              { route_type: "wire", x: 4, y: -2, width: 0.25, layer: "top" },
            ],
          },
          {
            connection: "C.1",
            route: [
              { route_type: "wire", x: -4, y: 2, width: 0.25, layer: "top" },
              { route_type: "wire", x: 4, y: 2, width: 0.25, layer: "top" },
            ],
          },
          {
            connection: "B.1",
            route: [
              { route_type: "wire", x: 0, y: -2, width: 0.25, layer: "top" },
              { route_type: "wire", x: 0, y: 2, width: 0.25, layer: "top" },
            ],
          },
        ]}
      />
      <pcbnotetext
        text="A–B and C–D are joined by a trunk at x=0"
        pcbY={4.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
