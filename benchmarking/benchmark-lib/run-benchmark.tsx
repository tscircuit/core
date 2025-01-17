import { Circuit } from "lib"
import { getPhaseTimingsFromRenderEvents } from "lib/utils/render-events/getPhaseTimingsFromRenderEvents"

export const runBenchmark = async ({ Component }: { Component: any }) => {
  const circuit = new Circuit()

  if (!Component) {
    throw new Error("Invalid/null component was provided to runBenchmark")
  }

  circuit.add(<Component />)

  const renderEvents: any[] = []
  circuit.on("renderable:renderLifecycle:anyEvent", (ev) => {
    ev.createdAt = performance.now()
    renderEvents.push(ev)
  })

  circuit.render()

  const phaseTimings = getPhaseTimingsFromRenderEvents(renderEvents)

  return phaseTimings
}
