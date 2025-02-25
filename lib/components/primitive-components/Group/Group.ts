import {
  type AutorouterConfig,
  type SubcircuitGroupProps,
  groupProps,
} from "@tscircuit/props"
import * as SAL from "@tscircuit/schematic-autolayout"
import {
  type PcbTrace,
  type SchematicComponent,
  type SchematicPort,
  type SourceTrace,
} from "circuit-json"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import Debug from "debug"
import { CapacityMeshAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromTracesAndDb } from "lib/utils/autorouting/getSimpleRouteJsonFromTracesAndDb"
import { z } from "zod"
import { NormalComponent } from "../../base-components/NormalComponent/NormalComponent"
import type { Trace } from "../Trace/Trace"
import type { TraceI } from "../Trace/TraceI"
import { TraceHint } from "../TraceHint"
import type { ISubcircuit } from "./ISubcircuit"

export class Group<Props extends z.ZodType<any, any, any> = typeof groupProps>
  extends NormalComponent<Props>
  implements ISubcircuit
{
  pcb_group_id: string | null = null
  subcircuit_id: string | null = null

  _hasStartedAsyncAutorouting = false
  _capacityAutorouter: CapacityMeshAutorouter | null = null
  _capacityAutoroutingInProgress = false

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

  doInitialSourceRender() {
    const { db } = this.root!
    const source_group = db.source_group.insert({
      name: this._parsedProps.name,
      is_subcircuit: this.isSubcircuit,
    })
    this.subcircuit_id = `subcircuit_${source_group.source_group_id}`
    this.source_group_id = source_group.source_group_id
    db.source_group.update(source_group.source_group_id, {
      subcircuit_id: this.subcircuit_id!,
    })
  }

  doInitialSourceParentAttachment() {
    const { db } = this.root!
    if (!this.isSubcircuit) return
    const parent_subcircuit_id = this.parent?.getSubcircuit?.()?.subcircuit_id
    if (!parent_subcircuit_id) return
    db.source_group.update(this.source_group_id!, {
      parent_subcircuit_id,
    })
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const pcb_group = db.pcb_group.insert({
      is_subcircuit: this.isSubcircuit,
      subcircuit_id: this.subcircuit_id!,
      name: this._parsedProps.name,
      center: this._getGlobalPcbPositionBeforeLayout(),
      width: 0,
      height: 0,
      pcb_component_ids: [],
      source_group_id: this.source_group_id!,
    })
    this.pcb_group_id = pcb_group.pcb_group_id
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

  _areChildSubcircuitsRouted(): boolean {
    const subcircuitChildren = this.selectAll("group").filter(
      (g) => g.isSubcircuit,
    ) as Group[]
    for (const subcircuitChild of subcircuitChildren) {
      if (
        subcircuitChild._shouldRouteAsync() &&
        !subcircuitChild._asyncAutoroutingResult
      ) {
        return false
      }
    }
    return true
  }

  _shouldRouteAsync(): boolean {
    const autorouter = this._getAutorouterConfig()
    if (autorouter.local) return false
    if (autorouter.groupMode === "sequential-trace") return false
    return true
  }

  _hasTracesToRoute(): boolean {
    const debug = Debug("tscircuit:core:_hasTracesToRoute")
    const traces = this.selectAll("trace") as Trace[]
    debug(`[${this.getString()}] has ${traces.length} traces to route`)
    return traces.length > 0
  }

  async _runEffectMakeHttpAutoroutingRequest() {
    const { db } = this.root!
    const debug = Debug("tscircuit:core:_runEffectMakeHttpAutoroutingRequest")
    const props = this._parsedProps as SubcircuitGroupProps

    const autorouterConfig = this._getAutorouterConfig()

    const serverUrl = autorouterConfig.serverUrl!
    const serverMode = autorouterConfig.serverMode!

    const fetchWithDebug = (url: string, options: RequestInit) => {
      debug("fetching", url)
      return fetch(url, options)
    }

    // Only include source and pcb elements
    const pcbAndSourceCircuitJson = this.root!.db.toArray().filter(
      (element) => {
        return (
          element.type.startsWith("source_") || element.type.startsWith("pcb_")
        )
      },
    )

    if (serverMode === "solve-endpoint") {
      // Legacy solve endpoint mode
      if (this.props.autorouter?.inputFormat === "simplified") {
        const { autorouting_result } = await fetchWithDebug(
          `${serverUrl}/autorouting/solve`,
          {
            method: "POST",
            body: JSON.stringify({
              input_simple_route_json: this._getSimpleRouteJsonFromPcbTraces(),
              subcircuit_id: this.subcircuit_id!,
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
            input_circuit_json: pcbAndSourceCircuitJson,
            subcircuit_id: this.subcircuit_id!,
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
          input_circuit_json: pcbAndSourceCircuitJson,
          provider: "freerouting",
          autostart: true,
          display_name: this.root?.name,
          subcircuit_id: this.subcircuit_id,
          server_cache_enabled: autorouterConfig.serverCacheEnabled,
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
          error: { message: string } | null
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
        db.pcb_autorouting_error.insert({
          pcb_error_id: autorouting_job.autorouting_job_id,
          message: job.error?.message ?? JSON.stringify(job.error),
        })
        throw new Error(`Autorouting job failed: ${JSON.stringify(job.error)}`)
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Starts the capacity mesh autorouter for local asynchronous routing
   */
  async _runCapacityMeshAutorouter(): Promise<void> {
    const debug = Debug("tscircuit:core:_runCapacityMeshAutorouter")
    const { db } = this.root!
    debug(`[${this.getString()}] starting capacity mesh autorouter`)
    
    // Get the SimpleRouteJson for all traces in this group
    const simpleRouteJson = this._getSimpleRouteJsonFromPcbTraces()
    
    // Skip if there are no connections to route
    if (!simpleRouteJson.connections || simpleRouteJson.connections.length === 0) {
      debug(`[${this.getString()}] no connections to route, skipping`)
      return
    }
    
    // Create the autorouter instance
    this._capacityAutorouter = new CapacityMeshAutorouter({
      input: simpleRouteJson,
    })
    
    // Start asynchronous routing
    this._capacityAutoroutingInProgress = true
    try {
      const success = await this._capacityAutorouter.solve()
      
      if (success) {
        debug(`[${this.getString()}] capacity mesh autorouter succeeded`)
        const traces = this._capacityAutorouter.solveAndMapToTraces()
        
        this._asyncAutoroutingResult = {
          output_pcb_traces: traces,
        }
        
        this._capacityAutoroutingInProgress = false
        this._markDirty("PcbTraceRender")
      } else {
        debug(`[${this.getString()}] capacity mesh autorouter failed`)
        // Fall back to HTTP autorouting if configured
        const autorouter = this._getAutorouterConfig()
        if (!autorouter.local && autorouter.serverUrl) {
          debug(`[${this.getString()}] falling back to HTTP autorouting`)
          await this._runEffectMakeHttpAutoroutingRequest()
        }
      }
    } catch (e) {
      console.error(`Capacity mesh autorouter error:`, e)
      this._capacityAutoroutingInProgress = false
      
      // Fall back to HTTP autorouting if configured
      const autorouter = this._getAutorouterConfig()
      if (!autorouter.local && autorouter.serverUrl) {
        debug(`[${this.getString()}] falling back to HTTP autorouting after error`)
        await this._runEffectMakeHttpAutoroutingRequest()
      }
    }
  }

  _startAsyncAutorouting() {
    this._hasStartedAsyncAutorouting = true
    
    // Determine which type of autorouter to use
    const autorouter = this._getAutorouterConfig()
    
    if (autorouter.local && this._parsedProps._useCapacityAutorouter) {
      // Use the local capacity mesh autorouter
      this._queueAsyncEffect("capacity-mesh-autorouting", async () => 
        this._runCapacityMeshAutorouter()
      )
    } else if (!autorouter.local) {
      // Use the HTTP autorouter service
      this._queueAsyncEffect("make-http-autorouting-request", async () =>
        this._runEffectMakeHttpAutoroutingRequest(),
      )
    }
  }

  doInitialPcbTraceRender() {
    const debug = Debug("tscircuit:core:doInitialPcbTraceRender")
    if (!this.isSubcircuit) return
    if (this.root?.pcbDisabled) return
    if (this.getInheritedProperty("routingDisabled")) return
    if (this._shouldUseTraceByTraceRouting()) return

    if (!this._areChildSubcircuitsRouted()) {
      debug(
        `[${this.getString()}] child subcircuits are not routed, skipping async autorouting until subcircuits routed`,
      )
      return
    }

    debug(
      `[${this.getString()}] no child subcircuits to wait for, initiating async routing`,
    )
    if (!this._hasTracesToRoute()) return
    this._startAsyncAutorouting()
  }

  updatePcbTraceRender() {
    const debug = Debug("tscircuit:core:updatePcbTraceRender")
    if (!this.isSubcircuit) return
    if (
      this._shouldRouteAsync() &&
      this._hasTracesToRoute() &&
      !this._hasStartedAsyncAutorouting
    ) {
      if (this._areChildSubcircuitsRouted()) {
        debug(
          `[${this.getString()}] child subcircuits are now routed, starting async autorouting`,
        )
        this._startAsyncAutorouting()
      }
      return
    }

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
    const debug = Debug("tscircuit:core:_updatePcbTraceRenderFromPcbTraces")
    debug(`[${this.getString()}] updating with ${output_pcb_traces.length} PCB traces`)

    // Get existing traces for this subcircuit that we've already created
    // and might need to clean up first
    const existingPcbTraces = db.pcb_trace
      .list()
      .filter(trace => trace.subcircuit_id === this.subcircuit_id)
    
    // Delete any previously created traces that were auto-routed
    // (only if they have a source_trace_id, meaning they're from autorouting)
    for (const existingTrace of existingPcbTraces) {
      if (existingTrace.source_trace_id) {
        db.pcb_trace.delete(existingTrace.pcb_trace_id)
        
        // Also delete any vias associated with this trace
        const viasToDelete = db.pcb_via
          .list()
          .filter(via => via.pcb_trace_id === existingTrace.pcb_trace_id)
        
        for (const via of viasToDelete) {
          db.pcb_via.delete(via.pcb_via_id)
        }
      }
    }

    // Collect all source traces in this subcircuit
    const sourceTraces = db.source_trace
      .list()
      .filter(trace => 
        trace.subcircuit_id === this.subcircuit_id
      )
    
    // Map from autorouter connection name to source_trace_id
    const connectionToSourceTraceMap = new Map<string, string>()
    for (const sourceTrace of sourceTraces) {
      // Use connectivity map key if available, otherwise use source_trace_id
      const key = sourceTrace.subcircuit_connectivity_map_key || sourceTrace.source_trace_id
      connectionToSourceTraceMap.set(key, sourceTrace.source_trace_id)
    }

    // Apply each routed trace to the corresponding circuit trace
    for (const pcb_trace of output_pcb_traces) {
      const sourceTraceId = pcb_trace.name ? 
        connectionToSourceTraceMap.get(pcb_trace.name) :
        null
      
      // Insert the PCB trace with appropriate metadata
      const newPcbTrace = db.pcb_trace.insert({
        ...pcb_trace,
        source_trace_id: sourceTraceId || undefined,
        subcircuit_id: this.subcircuit_id!,
        pcb_group_id: this.pcb_group_id || undefined,
      })
      
      // Create vias for any layer transitions in the trace route
      if (pcb_trace.route) {
        for (const point of pcb_trace.route) {
          if (point.route_type === "via") {
            db.pcb_via.insert({
              pcb_trace_id: newPcbTrace.pcb_trace_id,
              x: point.x,
              y: point.y,
              hole_diameter: 0.3,
              outer_diameter: 0.6,
              layers: [point.from_layer as string, point.to_layer as string],
              from_layer: point.from_layer as string,
              to_layer: point.to_layer as string,
            })
          }
        }
      }
    }
    
    debug(`[${this.getString()}] PCB trace update complete`)
  }

  doInitialSchematicLayout(): void {
    // The schematic_components are rendered in our children
    if (!this.isSubcircuit) return
    const props = this._parsedProps as SubcircuitGroupProps
    if (!props.schAutoLayoutEnabled) return
    const { db } = this.root!

    const descendants = this.getDescendants()

    const components: SchematicComponent[] = []
    const ports: SchematicPort[] = []
    // TODO move subcircuits as a group, don't re-layout subcircuits
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

  _getAutorouterConfig(): AutorouterConfig {
    const defaults = {
      serverUrl: "https://registry-api.tscircuit.com",
      serverMode: "job",
      serverCacheEnabled: false,
    }
    // Inherit from parent if not set by props
    const autorouter =
      this._parsedProps.autorouter ?? this.getInheritedProperty("autorouter")

    if (typeof autorouter === "object") {
      return {
        local: !(
          autorouter.serverUrl ||
          autorouter.serverMode ||
          autorouter.serverCacheEnabled
        ),
        ...defaults,
        ...autorouter,
      }
    }

    if (autorouter === "auto-local")
      return {
        local: true,
      }
    if (autorouter === "sequential-trace")
      return {
        local: true,
        groupMode: "sequential-trace",
      }
    return {
      local: true,
      groupMode: "sequential-trace",
    }
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
    // Inherit from parent if not set by props
    const autorouter = this._getAutorouterConfig()
    return autorouter.groupMode === "sequential-trace"
  }
}
