import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { resolveSavedTraceRouteWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved point widths render matching tapers in either route direction", async () => {
  const { circuit } = getTestFixture()
  const route = resolveSavedTraceRouteWidths([
    {
      route_type: "wire",
      x: -3,
      y: 0,
      width: 1,
      layer: "top",
      width_interpolation_mode: "quadratic",
    },
    { route_type: "wire", x: -1, y: 0, width: 0.2, layer: "top" },
    {
      route_type: "wire",
      x: 1,
      y: 0,
      width: 0.2,
      layer: "top",
      width_interpolation_mode: "linear",
    },
    { route_type: "wire", x: 3, y: 0, width: 0.8, layer: "top" },
  ] satisfies PcbTraceRoutePoint[])
  const reversed = reversePcbTraceRoute(route)
    .filter((point) => point.route_type === "wire")
    .map((point) => ({ ...point, y: -2 }))
  circuit.add(
    <board width={10} height={7}>
      <pcbtrace route={route} />
      <pcbtrace route={reversed} />
      <pcbnotetext
        pcbX={0}
        pcbY={2}
        text="Quadratic / constant / linear"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3}
        text="Reversed: same copper"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_trace
      .list()
      .flatMap((trace) => trace.route)
      .filter(
        (point) =>
          point.route_type === "wire" && point.width_interpolation_mode,
      ),
  ).toHaveLength(4)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
