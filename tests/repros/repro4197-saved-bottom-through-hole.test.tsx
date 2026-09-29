import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro4197: saved bottom route between plated pins is rejected", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routeRemaining={false}>
      <pcbnotetext
        pcbY={3}
        fontSize={0.5}
        text="Saved bottom route: J1 to J2, no vias"
      />
      <pinheader name="J1" pinCount={1} pcbX={-4} />
      <pinheader name="J2" pinCount={1} pcbX={4} />
      <trace from="J1.pin1" to="J2.pin1" />
      <autoroutingphase
        phaseIndex={0}
        connection="J1.pin1"
        pcbTracePaths={[
          {
            connection: "J1.pin1",
            route: [
              { route_type: "wire", x: -4, y: 0, width: 0.25, layer: "bottom" },
              { route_type: "wire", x: 4, y: 0, width: 0.25, layer: "bottom" },
            ],
          },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Capture the current failure for #4197; the stacked fix replaces these
  // expectations with the preserved bottom route and no connectivity errors.
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message:
        'Saved phase path "J1.pin1" must start at its PCB port on an available layer',
    },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
