import { expect, test } from "bun:test"
import { resolveSavedTraceRouteWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved point widths render matching tapers in either route direction", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={16} height={11}>
      {[2, -2].flatMap((y, index) => [
        <chip name={`J${index + 1}`} footprint="pinrow2" pcbX={-5} pcbY={y} />,
        <resistor
          name={`R${index + 1}`}
          resistance="33"
          footprint="0603"
          pcbX={4}
          pcbY={y}
        />,
        <trace
          from={`J${index + 1}.2`}
          to={`R${index + 1}.1`}
          thickness={0.2}
          pcbPath={[]}
        />,
      ])}
      <pcbnotetext
        pcbY={4.5}
        text="Header to 0603: quadratic escape / linear entry"
        fontSize={0.32}
      />
      <pcbnotetext
        pcbY={-4.5}
        text="Lower channel stored in reverse: same copper"
        fontSize={0.32}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [index, trace] of circuit.db.pcb_trace.list().entries()) {
    const start = trace.route[0]
    const end = trace.route.at(-1)!
    if (start.route_type !== "wire" || end.route_type !== "wire")
      throw new Error("Expected header-to-resistor wire endpoints")
    // Board-world mm, +X right / +Y up. Escape the header, make a 45-degree
    // detour, then narrow into a real 0603 pad. The second channel is identical.
    const route = resolveSavedTraceRouteWidths([
      { ...start, width: 1, width_interpolation_mode: "quadratic" },
      {
        route_type: "wire",
        x: start.x + 1.5,
        y: start.y,
        width: 0.2,
        layer: "top",
      },
      {
        route_type: "wire",
        x: start.x + 2.25,
        y: start.y - 0.75,
        width: 0.2,
        layer: "top",
      },
      {
        route_type: "wire",
        x: end.x - 2.25,
        y: end.y - 0.75,
        width: 0.2,
        layer: "top",
      },
      {
        route_type: "wire",
        x: end.x - 1.5,
        y: end.y,
        width: 0.2,
        layer: "top",
        width_interpolation_mode: "linear",
      },
      { ...end, width: 0.64 },
    ])
    circuit.db.pcb_trace.update(trace.pcb_trace_id, {
      route: index === 0 ? route : reversePcbTraceRoute(route),
    })
  }
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
