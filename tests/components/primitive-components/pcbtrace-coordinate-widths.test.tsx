import { expect, test } from "bun:test"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("coordinate route widths are used for both copper and footprint bounds", () => {
  const props = {
    layer: "bottom",
    thickness: "0.4mm",
    route: [
      { x: -2, y: 0, trace_width: "0.8mm" },
      { x: 2, y: 1 },
    ],
  } as const
  const trace = new PcbTrace({ ...props, route: [...props.route] })
  expect(trace._getPcbLocalBoundsBeforeLayout()).toEqual({
    left: -2.4,
    right: 2.2,
    bottom: -0.4,
    top: 1.2,
  })
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <pcbtrace layer="bottom" thickness="0.4mm" route={[...props.route]} />
      <pcbtrace
        route={[
          { x: -2, y: -2 },
          { x: 2, y: -2 },
        ]}
      />
      <pcbnotetext
        text="Bottom: 0.8 / 0.4 mm; top default: 0.15 mm"
        pcbY={3}
        fontSize={0.3}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_trace.list().map((t) => t.route)).toEqual([
    [
      { route_type: "wire", x: -2, y: 0, width: 0.8, layer: "bottom" },
      { route_type: "wire", x: 2, y: 1, width: 0.4, layer: "bottom" },
    ],
    [
      { route_type: "wire", x: -2, y: -2, width: 0.15, layer: "top" },
      { route_type: "wire", x: 2, y: -2, width: 0.15, layer: "top" },
    ],
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
