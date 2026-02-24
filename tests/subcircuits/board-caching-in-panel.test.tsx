import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board caching in panel with _subcircuitCachingEnabled", async () => {
  const { circuit } = getTestFixture()

  // Create a panel with multiple identical boards using _subcircuitCachingEnabled
  // The boards should be cached and reused since they have identical content
  circuit.add(
    <panel width="100mm" height="100mm" pcbX={0} pcbY={0}>
      <board
        name="B1"
        width="20mm"
        height="20mm"
        pcbX={-25}
        pcbY={0}
        _subcircuitCachingEnabled
      >
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
          pcbY={3}
        />
        <trace from=".R1 .pin2" to=".C1 .pin1" />
      </board>
      <board
        name="B2"
        width="20mm"
        height="20mm"
        pcbX={25}
        pcbY={0}
        _subcircuitCachingEnabled
      >
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
          pcbY={3}
        />
        <trace from=".R1 .pin2" to=".C1 .pin1" />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // Verify both boards were rendered
  const pcbBoards = circuit.db.pcb_board.list()
  expect(pcbBoards.length).toBe(2)

  // Verify the boards are at different positions
  const boardCenters = pcbBoards.map((b) => b.center)
  expect(boardCenters[0].x).not.toBe(boardCenters[1].x)

  // Verify components were rendered for both boards
  const resistors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_resistor")
  expect(resistors.length).toBe(2)

  const capacitors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_capacitor")
  expect(capacitors.length).toBe(2)

  // Verify PCB components were rendered for both boards
  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(4) // 2 resistors + 2 capacitors

  // Verify traces were rendered
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBe(2) // One trace per board

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("board caching performance - identical boards should use cache", async () => {
  const { circuit } = getTestFixture()

  // Track cache and pending render usage to verify caching behavior
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
    <panel width="150mm" height="100mm" pcbX={0} pcbY={0}>
      <board
        name="B1"
        width="20mm"
        height="20mm"
        pcbX={-40}
        pcbY={0}
        _subcircuitCachingEnabled
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>
      <board
        name="B2"
        width="20mm"
        height="20mm"
        pcbX={0}
        pcbY={0}
        _subcircuitCachingEnabled
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>
      <board
        name="B3"
        width="20mm"
        height="20mm"
        pcbX={40}
        pcbY={0}
        _subcircuitCachingEnabled
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // All 3 boards should be rendered
  const pcbBoards = circuit.db.pcb_board.list()
  expect(pcbBoards.length).toBe(3)

  // Verify caching is working:
  // - Only 1 cache set (first board renders and caches result)
  // - 2 pending promise hits (second and third boards wait for first board)
  expect(cacheSetCount.value).toBe(1)
  expect(pendingSetKeys.length).toBe(1)
  expect(pendingGetHits.length).toBe(2)
})
