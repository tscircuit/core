import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import type { CircuitJson, PcbTraceRoutePoint, PcbVia } from "circuit-json"

type ViaRoutePointWithDiameters = Extract<
  PcbTraceRoutePoint,
  { route_type: "via" }
> & {
  hole_diameter?: number
  outer_diameter?: number
  via_hole_diameter?: number
  via_diameter?: number
}

const getPcbVias = (circuitJson: CircuitJson): PcbVia[] =>
  circuitJson.filter((element): element is PcbVia => element.type === "pcb_via")

const getPcbTraceRouteViaPoints = (
  circuitJson: CircuitJson,
): ViaRoutePointWithDiameters[] =>
  circuitJson.flatMap((element) =>
    element.type === "pcb_trace"
      ? element.route.filter(
          (point): point is ViaRoutePointWithDiameters =>
            point.route_type === "via",
        )
      : [],
  )

const viasMatch = (a: PcbVia, b: PcbVia) =>
  Math.abs(a.x - b.x) < 1e-6 &&
  Math.abs(a.y - b.y) < 1e-6 &&
  Math.abs((a.hole_diameter ?? 0) - (b.hole_diameter ?? 0)) < 1e-6 &&
  Math.abs((a.outer_diameter ?? 0) - (b.outer_diameter ?? 0)) < 1e-6

const viaMatchesRoutePoint = (
  via: PcbVia,
  routePoint: ViaRoutePointWithDiameters,
) =>
  Math.abs(via.x - routePoint.x) < 1e-6 &&
  Math.abs(via.y - routePoint.y) < 1e-6 &&
  Math.abs(
    (via.hole_diameter ?? 0) -
      (routePoint.hole_diameter ?? routePoint.via_hole_diameter ?? 0),
  ) < 1e-6 &&
  Math.abs(
    (via.outer_diameter ?? 0) -
      (routePoint.outer_diameter ?? routePoint.via_diameter ?? 0),
  ) < 1e-6

test("repro116: arduino uno trace and via inflation", async () => {
  const { circuit } = getTestFixture()

  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  const arduinoUnoCircuitJson = converter.getOutput() as CircuitJson

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(1)

  const rawVias = getPcbVias(arduinoUnoCircuitJson)
  const inflatedVias = circuit.db.pcb_via.list()
  expect(rawVias.length).toBeGreaterThan(0)
  expect(inflatedVias.length).toBeGreaterThanOrEqual(rawVias.length)
  for (const rawVia of rawVias) {
    expect(
      inflatedVias.some((inflatedVia) => viasMatch(rawVia, inflatedVia)),
    ).toBe(true)
  }

  const rawTraceRouteVias = getPcbTraceRouteViaPoints(arduinoUnoCircuitJson)
  expect(rawTraceRouteVias.length).toBeGreaterThan(0)
  for (const rawRouteVia of rawTraceRouteVias) {
    expect(
      inflatedVias.some((inflatedVia) =>
        viaMatchesRoutePoint(inflatedVia, rawRouteVia),
      ),
    ).toBe(true)
  }

  expect(arduinoUnoCircuitJson).toMatchPcbSnapshot(
    `${import.meta.path}-before-inflation`,
  )
  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-after-inflation`)
}, 15_000)
