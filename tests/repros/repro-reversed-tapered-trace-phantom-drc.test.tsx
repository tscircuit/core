import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reversed 0.8mm to 0.35mm power taper into a via has no phantom clearance error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={8} routeRemaining={false} schematicDisabled>
      <testpoint name="P1" footprintVariant="pad" pcbX={5} pcbY={0} />
      <pinheader name="J2" pinCount={1} pcbX={-5} pcbY={0} />
      <testpoint name="S1" footprintVariant="pad" pcbX={-3} pcbY={1.5} />
      <testpoint name="S2" footprintVariant="pad" pcbX={3} pcbY={1.5} />
      <pcbnotetext
        text="Saved 0.8mm to 0.35mm power taper into a via, next to a signal trace"
        pcbY={3}
        fontSize={0.4}
      />
      <trace from="P1.1" to="J2.pin1" />
      <trace from="S1.1" to="S2.1" />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          {
            connection: "J2.pin1",
            route: [
              { route_type: "wire", x: -5, y: 0, width: 0.8, layer: "bottom" },
              { route_type: "wire", x: 0, y: 0, width: 0.8, layer: "bottom" },
              {
                route_type: "via",
                x: 0,
                y: 0,
                from_layer: "bottom",
                to_layer: "top",
              },
              { route_type: "wire", x: 0, y: 0, width: 0.35, layer: "top" },
              { route_type: "wire", x: 1, y: 0, width: 0.35, layer: "top" },
              { route_type: "wire", x: 2, y: 0, width: 0.8, layer: "top" },
              { route_type: "wire", x: 5, y: 0, width: 0.8, layer: "top" },
            ],
          },
          {
            connection: "S1.1",
            route: [
              { route_type: "wire", x: -3, y: 1.5, width: 0.25, layer: "top" },
              { route_type: "wire", x: -1, y: 0.55, width: 0.25, layer: "top" },
              { route_type: "wire", x: 1, y: 0.55, width: 0.25, layer: "top" },
              { route_type: "wire", x: 3, y: 1.5, width: 0.25, layer: "top" },
            ],
          },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
