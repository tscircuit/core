import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import type { RenderPhase } from "lib/components/base-components/Renderable"

test("render lifecycle events are emitted", () => {
  const circuit = new RootCircuit()
  const lifecycleEvents: Array<{
    type: string
    renderId: string
    componentDisplayName: string
  }> = []
  const boardPhaseStartedEvents: Array<{
    type: string
    renderId: string
    phase: RenderPhase
  }> = []

  // Listen for all render lifecycle events
  circuit.on("renderable:renderLifecycle:anyEvent", (event) => {
    lifecycleEvents.push(event)
  })
  circuit.on("board:renderPhaseStarted", (event) => {
    boardPhaseStartedEvents.push(event)
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  // Verify events were emitted for each render phase
  const phases = [
    "ReactSubtreesRender",
    "FootprintRender",
    "InitializePortsFromChildren",
    "CreateNetsFromProps",
    "SourceRender",
  ] as RenderPhase[]

  for (const phase of phases) {
    const startEvent = lifecycleEvents.find(
      (e) => e.type === `renderable:renderLifecycle:${phase}:start`,
    )
    const endEvent = lifecycleEvents.find(
      (e) => e.type === `renderable:renderLifecycle:${phase}:end`,
    )

    expect(startEvent).toBeTruthy()
    expect(endEvent).toBeTruthy()
  }

  // Verify events contain component info
  const firstEvent = lifecycleEvents[0]
  expect(firstEvent.componentDisplayName).toBeTruthy()

  expect(boardPhaseStartedEvents.length).toBeGreaterThan(5)
})
