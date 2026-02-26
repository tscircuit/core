import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with _subcircuitCachingEnabled and multiple boards", async () => {
  const { circuit } = getTestFixture()

  // Create a panel with multiple subpanels, each with _subcircuitCachingEnabled
  // Each subpanel contains its own board with identical content
  circuit.add(
    <panel width="150mm" height="100mm" pcbX={0} pcbY={0}>
      <subpanel pcbX={-40} pcbY={0} _subcircuitCachingEnabled>
        <board name="B1" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            pcbX={0}
            pcbY={5}
          />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
        </board>
      </subpanel>
      <subpanel pcbX={0} pcbY={0} _subcircuitCachingEnabled>
        <board name="B2" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            pcbX={0}
            pcbY={5}
          />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
        </board>
      </subpanel>
      <subpanel pcbX={40} pcbY={0} _subcircuitCachingEnabled>
        <board name="B3" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            pcbX={0}
            pcbY={5}
          />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
        </board>
      </subpanel>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // Verify all boards were rendered
  const pcbBoards = circuit.db.pcb_board.list()
  expect(pcbBoards.length).toBe(3)

  // Verify boards are at different positions
  const boardCenters = pcbBoards.map((b) => b.center)
  const uniqueXPositions = new Set(boardCenters.map((c) => c.x))
  expect(uniqueXPositions.size).toBe(3)

  // Verify components were rendered for all boards
  const resistors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_resistor")
  expect(resistors.length).toBe(3)

  const capacitors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_capacitor")
  expect(capacitors.length).toBe(3)

  // Verify PCB components were rendered for all boards
  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(6) // 3 resistors + 3 capacitors

  // Verify traces were rendered
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBe(3) // One trace per board

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("subpanel caching performance - identical subpanels should use cache", async () => {
  const { circuit } = getTestFixture()

  // Track cache usage to verify caching behavior
  const cacheSetCount = { value: 0 }
  const pendingSetKeys: string[] = []
  const pendingGetHits: string[] = []
  const cachedSubcircuits = circuit.cachedSubcircuits!
  const pendingSubcircuitRenders = circuit.pendingSubcircuitRenders!
  const originalSet = cachedSubcircuits.set.bind(cachedSubcircuits)
  const pendingOriginalGet = pendingSubcircuitRenders.get.bind(
    pendingSubcircuitRenders,
  )
  const pendingOriginalSet = pendingSubcircuitRenders.set.bind(
    pendingSubcircuitRenders,
  )
  cachedSubcircuits.set = (key: string, value: any) => {
    cacheSetCount.value++
    return originalSet(key, value)
  }
  pendingSubcircuitRenders.get = (key: string) => {
    const result = pendingOriginalGet(key)
    if (result) pendingGetHits.push(key)
    return result
  }
  pendingSubcircuitRenders.set = (key: string, value: any) => {
    pendingSetKeys.push(key)
    return pendingOriginalSet(key, value)
  }

  circuit.add(
    <panel width="200mm" height="100mm" pcbX={0} pcbY={0}>
      <subpanel pcbX={-60} pcbY={0} _subcircuitCachingEnabled>
        <board name="B1" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={-20} pcbY={0} _subcircuitCachingEnabled>
        <board name="B2" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={20} pcbY={0} _subcircuitCachingEnabled>
        <board name="B3" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={60} pcbY={0} _subcircuitCachingEnabled>
        <board name="B4" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // All 4 boards should be rendered
  const pcbBoards = circuit.db.pcb_board.list()
  expect(pcbBoards.length).toBe(4)

  // Verify caching is working:
  // - Only 1 cache set (first subpanel renders and caches result)
  // - 3 pending promise hits (second, third, fourth subpanels wait for first)
  expect(cacheSetCount.value).toBe(1)
  expect(pendingSetKeys.length).toBe(1)
  expect(pendingGetHits.length).toBe(3)
})

test("panel with _subcircuitCachingEnabled propagates to all boards", async () => {
  const { circuit } = getTestFixture()

  // Track cache usage to verify caching behavior
  const cacheSetCount = { value: 0 }
  const pendingGetHits: string[] = []
  const cachedSubcircuits = circuit.cachedSubcircuits!
  const pendingSubcircuitRenders = circuit.pendingSubcircuitRenders!
  const originalSet = cachedSubcircuits.set.bind(cachedSubcircuits)
  const pendingOriginalGet = pendingSubcircuitRenders.get.bind(
    pendingSubcircuitRenders,
  )
  cachedSubcircuits.set = (key: string, value: any) => {
    cacheSetCount.value++
    return originalSet(key, value)
  }
  pendingSubcircuitRenders.get = (key: string) => {
    const result = pendingOriginalGet(key)
    if (result) pendingGetHits.push(key)
    return result
  }

  // Set _subcircuitCachingEnabled on the top-level panel
  // All boards inside should inherit this and use caching
  circuit.add(
    <panel
      width="200mm"
      height="100mm"
      pcbX={0}
      pcbY={0}
      _subcircuitCachingEnabled
    >
      <subpanel pcbX={-60} pcbY={0}>
        <board name="B1" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={-20} pcbY={0}>
        <board name="B2" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={20} pcbY={0}>
        <board name="B3" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
      <subpanel pcbX={60} pcbY={0}>
        <board name="B4" width="30mm" height="30mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={0}
            pcbY={0}
          />
        </board>
      </subpanel>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // All 4 boards should be rendered
  const pcbBoards = circuit.db.pcb_board.list()
  expect(pcbBoards.length).toBe(4)

  // Verify caching is working:
  // - Only 1 cache set (first board renders and caches result)
  // - 3 pending promise hits (other boards wait for first)
  expect(cacheSetCount.value).toBe(1)
  expect(pendingGetHits.length).toBe(3)
})
