import { orderedRenderPhases } from "lib/components/base-components/Renderable"

type RenderEvent = { type: string; renderId: string; createdAt: number }

/**
 * Given a list of render events, return a map of how much time was spent in each
 * render phase.
 *
 * To get the time spent in each phase, you have to find the end event for each
 * start event and subtract the createdAt of the start event from the createdAt
 */
export const getPhaseTimingsFromRenderEvents = (
  renderEvents: RenderEvent[],
): Record<string, number> => {
  const phaseTimings: Record<string, number> = {}
  if (!renderEvents) return phaseTimings

  for (const renderPhase of orderedRenderPhases) {
    phaseTimings[renderPhase] = 0
  }

  // Create a map to store start events by phase and renderId
  const startEvents = new Map<string, RenderEvent>()

  for (const event of renderEvents) {
    const [, , phase, eventType] = event.type.split(":")

    // For start events, store them in the map keyed by phase+renderId
    if (eventType === "start") {
      startEvents.set(`${phase}:${event.renderId}`, event)
      continue
    }

    // For end events, find matching start event and calculate duration
    if (eventType === "end") {
      const startEvent = startEvents.get(`${phase}:${event.renderId}`)
      if (startEvent) {
        const duration = event.createdAt - startEvent.createdAt
        phaseTimings[phase] = (phaseTimings[phase] || 0) + duration
      }
    }
  }

  return phaseTimings
}
