import {
  groupProps,
  type GroupProps,
  type SubcircuitGroupProps,
} from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { compose, identity } from "transformation-matrix"
import { z } from "zod"
import { NormalComponent } from "../../base-components/NormalComponent"
import { TraceHint } from "../TraceHint"
import type {
  PcbTrace,
  SchematicComponent,
  SchematicPort,
  SourceTrace,
} from "circuit-json"
import * as SAL from "@tscircuit/schematic-autolayout"
import type { ISubcircuit } from "./ISubcircuit"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getObstaclesFromSoup } from "@tscircuit/infgrid-ijump-astar"
import type { Trace } from "../Trace/Trace"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { TraceI } from "../Trace/TraceI"
import { getSimpleRouteJsonFromTracesAndDb } from "lib/utils/autorouting/getSimpleRouteJsonFromTracesAndDb"
import Debug from "debug"

export class Group<Props extends z.ZodType<any, any, any> = typeof groupProps>
  extends NormalComponent<Props>
  implements ISubcircuit
{
  _asyncAutoroutingResult: {
    output_simple_route_json?: SimpleRouteJson
    output_pcb_traces?: PcbTrace[]
  } | null = null

  get config() {
    return {
      zodProps: groupProps as unknown as Props,
      componentName: "Group",
    }
  }

  doInitialCreateTraceHintsFromProps(): void {
    const { _parsedProps: props } = this
    const { db } = this.root!

    const groupProps = props as SubcircuitGroupProps

    if (!this.isSubcircuit) return

    const manualTraceHints = groupProps.layout?.manual_trace_hints

    if (!manualTraceHints) return

    for (const manualTraceHint of manualTraceHints) {
      this.add(
        new TraceHint({
          for: manualTraceHint.pcb_port_selector,
          offsets: manualTraceHint.offsets,
        }),
      )
    }
  }

  _getSimpleRouteJsonFromPcbTraces(): SimpleRouteJson {
    const traces = this.selectAll("trace") as Trace[]
    const { db } = this.root!

    return getSimpleRouteJsonFromTracesAndDb({
      db,
      traces,
      minTraceWidth: this._parsedProps.minTraceWidth ?? 0.1,
    })
  }

  doInitialSourceAddConnectivityMapKey(): void {
    if (!this.isSubcircuit) return
    const { db } = this.root!
    // Find all traces that belong to this subcircuit, generate a connectivity
    // map, and add source_trace.subcircuit_connectivity_map_key
    const traces = this.selectAll("trace") as TraceI[]
    const connMap = new ConnectivityMap({})
    connMap.addConnections(
      traces
        .map((t) => {
          const source_trace = db.source_trace.get(
            t.source_trace_id!,
          ) as SourceTrace
          if (!source_trace) return null

          return [
            source_trace.source_trace_id,
            ...source_trace.connected_source_port_ids,
            ...source_trace.connected_source_net_ids,
          ]
        })
        .filter((c): c is string[] => c !== null),
    )

    for (const trace of traces) {
      if (!trace.source_trace_id) continue
      const connNetId = connMap.getNetConnectedToId(trace.source_trace_id)
      if (!connNetId) continue
      const { name: subcircuitName } = this._parsedProps
      trace.subcircuit_connectivity_map_key = `${subcircuitName ?? `unnamedsubcircuit${this._renderId}`}_${connNetId}`
      db.source_trace.update(trace.source_trace_id, {
        subcircuit_connectivity_map_key: trace.subcircuit_connectivity_map_key!,
      })
    }
  }

  doInitialPcbTraceRender() {
    if (this.root?.pcbDisabled) return
    if (this._shouldUseTraceByTraceRouting()) return

    const serverUrl =
      this.props.autorouter?.serverUrl ?? "https://registry-api.tscircuit.com"
    const serverMode = this.props.autorouter?.serverMode ?? "job"

    const debug = Debug("tscircuit:core:autorouting")

    const fetchWithDebug = (url: string, options: RequestInit) => {
      debug("fetching", url)
      return fetch(url, options)
    }

    // Queue the autorouting request
    this._queueAsyncEffect("make-http-autorouting-request", async () => {
      if (serverMode === "solve-endpoint") {
        // Legacy solve endpoint mode
        if (this.props.autorouter?.inputFormat === "simplified") {
          const { autorouting_result } = await fetchWithDebug(
            `${serverUrl}/autorouting/solve`,
            {
              method: "POST",
              body: JSON.stringify({
                input_simple_route_json:
                  this._getSimpleRouteJsonFromPcbTraces(),
              }),
              headers: { "Content-Type": "application/json" },
            },
          ).then((r) => r.json())
          this._asyncAutoroutingResult = autorouting_result
          this._markDirty("PcbTraceRender")
          return
        }

        const { autorouting_result } = await fetchWithDebug(
          `${serverUrl}/autorouting/solve`,
          {
            method: "POST",
            body: JSON.stringify({
              input_circuit_json: this.root!.db.toArray(),
            }),
            headers: { "Content-Type": "application/json" },
          },
        ).then((r) => r.json())
        this._asyncAutoroutingResult = autorouting_result
        this._markDirty("PcbTraceRender")
        return
      }

      const { autorouting_job } = await fetchWithDebug(
        `${serverUrl}/autorouting/jobs/create`,
        {
          method: "POST",
          body: JSON.stringify({
            input_circuit_json: this.root!.db.toArray(),
            provider: "freerouting",
            autostart: true,
          }),
          headers: { "Content-Type": "application/json" },
        },
      ).then((r) => r.json())

      // Poll until job is complete
      while (true) {
        const { autorouting_job: job } = (await fetchWithDebug(
          `${serverUrl}/autorouting/jobs/get`,
          {
            method: "POST",
            body: JSON.stringify({
              autorouting_job_id: autorouting_job.autorouting_job_id,
            }),
            headers: { "Content-Type": "application/json" },
          },
        ).then((r) => r.json())) as {
          autorouting_job: {
            autorouting_job_id: string
            is_running: boolean
            is_started: boolean
            is_finished: boolean
            has_error: boolean
            error: string | null
            autorouting_provider: "freerouting" | "tscircuit"
            created_at: string
            started_at?: string
            finished_at?: string
          }
        }

        if (job.is_finished) {
          const { autorouting_job_output } = await fetchWithDebug(
            `${serverUrl}/autorouting/jobs/get_output`,
            {
              method: "POST",
              body: JSON.stringify({
                autorouting_job_id: autorouting_job.autorouting_job_id,
              }),
              headers: { "Content-Type": "application/json" },
            },
          ).then((r) => r.json())

          this._asyncAutoroutingResult = {
            output_pcb_traces: autorouting_job_output.output_pcb_traces,
          }
          this._markDirty("PcbTraceRender")
          break
        }

        if (job.has_error) {
          throw new Error(
            `Autorouting job failed: ${JSON.stringify(job.error)}`,
          )
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    })
  }

  updatePcbTraceRender() {
    if (!this._asyncAutoroutingResult) return
    if (this._shouldUseTraceByTraceRouting()) return

    const { db } = this.root!

    if (this._asyncAutoroutingResult.output_simple_route_json) {
      this._updatePcbTraceRenderFromSimpleRouteJson()
      return
    }

    if (this._asyncAutoroutingResult.output_pcb_traces) {
      this._updatePcbTraceRenderFromPcbTraces()
      return
    }
  }

  _updatePcbTraceRenderFromSimpleRouteJson() {
    const { db } = this.root!
    const { traces: routedTraces } =
      this._asyncAutoroutingResult!.output_simple_route_json!

    if (!routedTraces) return

    // Delete any previously created traces
    // TODO

    // Apply each routed trace to the corresponding circuit trace
    const circuitTraces = this.selectAll("trace") as Trace[]
    for (const routedTrace of routedTraces) {
      // const circuitTrace = circuitTraces.find(
      //   (t) => t.source_trace_id === routedTrace.,
      // )

      // Create the PCB trace with the routed path
      // TODO use upsert to make sure we're not re-creating traces
      const pcb_trace = db.pcb_trace.insert({
        route: routedTrace.route as any,
        // source_trace_id: circuitTrace.source_trace_id!,
      })
      // circuitTrace.pcb_trace_id = pcb_trace.pcb_trace_id

      // Create vias for any layer transitions
      // for (const point of routedTrace.route) {
      //   if (point.route_type === "via") {
      //     db.pcb_via.insert({
      //       pcb_trace_id: pcb_trace.pcb_trace_id,
      //       x: point.x,
      //       y: point.y,
      //       hole_diameter: 0.3,
      //       outer_diameter: 0.6,
      //       layers: [point.from_layer, point.to_layer],
      //       from_layer: point.from_layer,
      //       to_layer: point.to_layer,
      //     })
      //   }
      // }
    }
  }

  _updatePcbTraceRenderFromPcbTraces() {
    const { output_pcb_traces } = this._asyncAutoroutingResult!
    if (!output_pcb_traces) return

    const { db } = this.root!

    // Delete any previously created traces
    // TODO

    // Apply each routed trace to the corresponding circuit trace
    for (const pcb_trace of output_pcb_traces) {
      db.pcb_trace.insert(pcb_trace)
    }
  }

  _computeSchematicPositionBeforeLayout(): void {
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps

    const offsetX = Number(props.schX ?? 0)
    const offsetY = Number(props.schY ?? 0)

    const descendants = this.getDescendants()

    for (const descendant of descendants) {
      if ("schematic_component_id" in descendant) {
        const component = db.schematic_component.get(
          descendant.schematic_component_id!,
        )
        if (component) {
          db.schematic_component.update(component.schematic_component_id!, {
            ...component,
            center: {
              x: component.center.x + offsetX,
              y: component.center.y + offsetY,
            },
          })
        }
      }
    }
  }

  doInitialSchematicLayout(): void {
    
    this._computeSchematicPositionBeforeLayout()
    // The schematic_components are rendered in our children
    if (!this.isSubcircuit) return

    const props = this._parsedProps as SubcircuitGroupProps
    if (!props.schAutoLayoutEnabled) return


    const { db } = this.root!

    const descendants = this.getDescendants()

    const components: SchematicComponent[] = []
    const ports: SchematicPort[] = []

    for (const descendant of descendants) {
      if ("schematic_component_id" in descendant) {
        const component = db.schematic_component.get(
          descendant.schematic_component_id!,
        )
        if (component) {
          // Get all ports associated with this component
          const schPorts = db.schematic_port
            .list()
            .filter(
              (p) =>
                p.schematic_component_id === component.schematic_component_id,
            )

          components.push(component)
          ports.push(...schPorts)
        }
      }
    }

    // TODO only move components that belong to this subcircuit
    const scene = SAL.convertSoupToScene(db.toArray())

    const laidOutScene = SAL.ascendingCentralLrBug1(scene)

    SAL.mutateSoupForScene(db.toArray(), laidOutScene)
  }

  /**
   * Trace-by-trace autorouting is where each trace routes itself in a well-known
   * order. It's the most deterministic way to autoroute, because a new trace
   * is generally ordered last.
   *
   * This method will return false if using an external service for autorouting
   * or if using a "fullview" or "rip and replace" autorouting mode
   */
  _shouldUseTraceByTraceRouting(): boolean {
    const props = this._parsedProps as SubcircuitGroupProps
    if (props.autorouter === "auto-local") return true
    if (props.autorouter === "sequential-trace") return true
    if (props.autorouter) return false
    return true
  }
}
