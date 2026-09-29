import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved bottom routes still reject off-pad plated pin anchors", async () => {
  for (const [startX, endX, error] of [
    [-3, 4, "must start at its PCB port"],
    [-4, 3, "must end at another connection endpoint"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={14} height={10} routeRemaining={false}>
        <pinheader name="J1" pinCount={1} pcbX={-4} />
        <pinheader name="J2" pinCount={1} pcbX={4} />
        <trace from="J1.pin1" to="J2.pin1" />
        <autoroutingphase
          connection="J1.pin1"
          pcbTracePaths={[
            {
              connection: "J1.pin1",
              route: [
                {
                  route_type: "wire",
                  x: startX,
                  y: 0,
                  width: 0.25,
                  layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: endX,
                  y: 0,
                  width: 0.25,
                  layer: "bottom",
                },
              ],
            },
          ]}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
      { message: expect.stringContaining(error) },
    ])
    expect(circuit.db.pcb_trace.list()).toEqual([])
  }
})
