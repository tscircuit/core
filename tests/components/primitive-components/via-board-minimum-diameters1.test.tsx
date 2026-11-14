import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const explicitlySizedRoute = [
  { route_type: "wire", x: 4, y: 0, width: 0.15, layer: "top" },
  {
    route_type: "via",
    x: 6,
    y: 0,
    from_layer: "top",
    to_layer: "bottom",
    hole_diameter: 0.45,
    outer_diameter: 0.9,
  },
  { route_type: "wire", x: 8, y: 0, width: 0.15, layer: "bottom" },
] satisfies PcbTraceRoutePoint[]

test("explicit and pcbStyle via sizes still win over the board's via minimums", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      routingDisabled
    >
      <via
        pcbX={-6}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter="0.4mm"
        outerDiameter="0.8mm"
      />
      <group pcbStyle={{ viaHoleDiameter: 0.35, viaPadDiameter: 0.7 }}>
        <via pcbX={0} pcbY={0} fromLayer="top" toLayer="bottom" />
      </group>
      <pcbtrace route={explicitlySizedRoute} />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.4}
        text="board minVia 0.3/0.6mm keeps explicit and styled sizes"
      />
      <pcbnotetext
        pcbX={-6}
        pcbY={-1.5}
        fontSize={0.4}
        text="explicit 0.4/0.8"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-1.5}
        fontSize={0.4}
        text="pcbStyle 0.35/0.7"
      />
      <pcbnotetext pcbX={6} pcbY={-1.5} fontSize={0.4} text="route 0.45/0.9" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_via
      .list()
      .map((via) => [via.hole_diameter, via.outer_diameter]),
  ).toEqual([
    [0.4, 0.8],
    [0.35, 0.7],
    [0.45, 0.9],
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
