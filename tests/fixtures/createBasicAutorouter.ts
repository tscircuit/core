import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
} from "../../lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "../../lib/utils/autorouting/SimpleRouteJson"

/**
 * Creates a basic autorouter for testing purposes
 *
 * @param routeGeneratorFn Function that generates traces from the input SimpleRouteJson
 * @returns An object with an algorithmFn that returns a GenericLocalAutorouter implementation
 */
export function createBasicAutorouter(
  routeGeneratorFn: (input: SimpleRouteJson) => Promise<SimplifiedPcbTrace[]>,
) {
  return async (
    simpleRouteJson: SimpleRouteJson,
  ): Promise<GenericLocalAutorouter> => {
    // Create event handlers
    const eventHandlers = {
      complete: [] as Array<(ev: AutorouterCompleteEvent) => void>,
      error: [] as Array<(ev: AutorouterErrorEvent) => void>,
      progress: [] as Array<(ev: AutorouterProgressEvent) => void>,
    }

    // Create the autorouter instance
    const autorouter: GenericLocalAutorouter = {
      input: simpleRouteJson,
      isRouting: false,

      async start() {
        if (this.isRouting) return
        this.isRouting = true

        // Generate traces using the provided function
        try {
          const traces = await routeGeneratorFn(this.input)

          // Emit a progress event
          for (const handler of eventHandlers.progress) {
            handler({
              type: "progress",
              steps: 1,
              progress: 1,
              phase: "complete",
            })
          }

          // Emit the complete event with generated traces
          setTimeout(() => {
            this.isRouting = false
            for (const handler of eventHandlers.complete) {
              handler({
                type: "complete",
                traces,
              })
            }
          }, 0)
        } catch (error) {
          // Handle any errors
          this.isRouting = false
          for (const handler of eventHandlers.error) {
            handler({
              type: "error",
              error: error instanceof Error ? error : new Error(String(error)),
            })
          }
        }
      },

      stop(): void {
        this.isRouting = false
      },

      on(event: "complete" | "error" | "progress", callback: any): void {
        if (event === "complete") {
          eventHandlers.complete.push(
            callback as (ev: AutorouterCompleteEvent) => void,
          )
        } else if (event === "error") {
          eventHandlers.error.push(
            callback as (ev: AutorouterErrorEvent) => void,
          )
        } else if (event === "progress") {
          eventHandlers.progress.push(
            callback as (ev: AutorouterProgressEvent) => void,
          )
        }
      },

      solveSync(): SimplifiedPcbTrace[] {
        throw new Error("Not implemented")
      },
    }

    return autorouter
  }
}
