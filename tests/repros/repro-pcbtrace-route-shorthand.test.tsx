import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "pcbtrace infers wire fields from component-level layer and thickness props",
  testPcbTraceShorthand,
)

async function testPcbTraceShorthand() {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <pcbnotetext
        text="PLAIN POINTS: TOP / 0.2mm"
        pcbY={6}
        fontSize={0.7}
        layer="top"
      />
      <pcbtrace
        layer="top"
        thickness="0.2mm"
        route={[
          { x: -4, y: 0 },
          { x: 0, y: 2 },
          { x: 4, y: 0 },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)
  expect(pcbTraces[0].route).toEqual([
    { route_type: "wire", x: -4, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 0, y: 2, width: 0.2, layer: "top" },
    { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "top" },
  ])
}
