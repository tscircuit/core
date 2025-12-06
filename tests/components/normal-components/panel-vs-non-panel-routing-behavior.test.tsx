import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

// Test board with components at explicit positions
const SimpleBoard = () => {
  return (
    <>
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </>
  )
}

test("panel-vs-non-panel: routing behavior should be identical", async () => {
  // Test 1: Board without panel
  const { circuit: circuitNoPanel } = getTestFixture()
  circuitNoPanel.add(
    <board width="25mm" height="25mm">
      <SimpleBoard />
    </board>,
  )
  await circuitNoPanel.renderUntilSettled()

  // Test 2: Board with panel
  const { circuit: circuitWithPanel } = getTestFixture()
  circuitWithPanel.add(
    <panel width="30mm" height="30mm" pcbX={0} pcbY={0}>
      <board width="25mm" height="25mm">
        <SimpleBoard />
      </board>
    </panel>,
  )
  await circuitWithPanel.renderUntilSettled()

  // Get the circuit JSON from both
  const jsonNoPanel = circuitNoPanel.getCircuitJson()
  const jsonWithPanel = circuitWithPanel.getCircuitJson()

  // Extract PCB components to verify positions are identical
  const componentsNoPanel = jsonNoPanel.filter(
    (e: any) => e.type === "pcb_component",
  ) as any[]
  const componentsWithPanel = jsonWithPanel.filter(
    (e: any) => e.type === "pcb_component",
  ) as any[]

  // Components should be at the same positions
  expect(componentsNoPanel.length).toBe(componentsWithPanel.length)
  for (let i = 0; i < componentsNoPanel.length; i++) {
    const noPanel = componentsNoPanel[i]
    const withPanel = componentsWithPanel[i]
    expect(noPanel.center.x).toBeCloseTo(withPanel.center.x, 5)
    expect(noPanel.center.y).toBeCloseTo(withPanel.center.y, 5)
  }

  // Extract PCB traces from both
  const tracesNoPanel = jsonNoPanel.filter(
    (e: any) => e.type === "pcb_trace",
  ) as any[]
  const tracesWithPanel = jsonWithPanel.filter(
    (e: any) => e.type === "pcb_trace",
  ) as any[]

  // Both should have the same number of traces
  expect(tracesNoPanel.length).toBe(tracesWithPanel.length)

  // Compare trace routes - they should be identical
  if (tracesNoPanel.length > 0 && tracesWithPanel.length > 0) {
    const traceNoPanel = tracesNoPanel[0]
    const traceWithPanel = tracesWithPanel[0]

    // Routes should be identical
    expect(traceNoPanel.route.length).toBe(traceWithPanel.route.length)
    for (let i = 0; i < traceNoPanel.route.length; i++) {
      const pointNoPanel = traceNoPanel.route[i]
      const pointWithPanel = traceWithPanel.route[i]
      expect(pointNoPanel.route_type).toBe(pointWithPanel.route_type)
      if (pointNoPanel.x !== undefined) {
        expect(pointNoPanel.x).toBeCloseTo(pointWithPanel.x, 5)
      }
      if (pointNoPanel.y !== undefined) {
        expect(pointNoPanel.y).toBeCloseTo(pointWithPanel.y, 5)
      }
    }
  }

  // Snapshot tests for visual comparison
  expect(circuitNoPanel).toMatchPcbSnapshot(import.meta.path + "-no-panel")
  expect(circuitWithPanel).toMatchPcbSnapshot(import.meta.path + "-with-panel")
})
