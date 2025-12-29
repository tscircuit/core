import {
  type AutorouterConfig,
  type SubcircuitGroupProps,
  groupProps,
} from "@tscircuit/props"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import {
  type LayerRef,
  type PcbTrace,
  type PcbVia,
  type SchematicComponent,
  type SchematicPort,
  distance,
} from "circuit-json"
import Debug from "debug"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { z } from "zod"
import { NormalComponent } from "../../base-components/NormalComponent/NormalComponent"
import type { Trace } from "../Trace/Trace"
import { TraceHint } from "../TraceHint"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/public-exports"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { Group_doInitialSchematicLayoutMatchAdapt } from "./Group_doInitialSchematicLayoutMatchAdapt"
import { Group_doInitialSchematicLayoutMatchPack } from "./Group_doInitialSchematicLayoutMatchPack"
import { Group_doInitialSourceAddConnectivityMapKey } from "./Group_doInitialSourceAddConnectivityMapKey"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { Group_doInitialSchematicLayoutGrid } from "./Group_doInitialSchematicLayoutGrid"
import { Group_doInitialSchematicLayoutFlex } from "./Group_doInitialSchematicLayoutFlex"
import { Group_doInitialPcbLayoutGrid } from "./Group_doInitialPcbLayoutGrid"
import { AutorouterError } from "lib/errors/AutorouterError"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { Group_doInitialPcbLayoutPack } from "./Group_doInitialPcbLayoutPack/Group_doInitialPcbLayoutPack"
import { Group_doInitialPcbLayoutFlex } from "./Group_doInitialPcbLayoutFlex"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import type { GraphicsObject } from "graphics-debug"
import { createSourceTracesFromOffboardConnections } from "lib/utils/autorouting/createSourceTracesFromOffboardConnections"
import { Group_doInitialSchematicTraceRender } from "./Group_doInitialSchematicTraceRender/Group_doInitialSchematicTraceRender"
import { Group_doInitialSimulationSpiceEngineRender } from "./Group_doInitialSimulationSpiceEngineRender"
import { Group_doInitialPcbComponentAnchorAlignment } from "./Group_doInitialPcbComponentAnchorAlignment"
import { computeCenterFromAnchorPosition } from "./utils/computeCenterFromAnchorPosition"

const getAutorouterEffort = (
  level?: SubcircuitGroupProps["autorouterEffortLevel"],
) => (level ? parseFloat(level.replace("x", "")) : undefined)

export class Group<Props extends z.ZodType<any, any, any> = typeof groupProps>
  extends NormalComponent<Props>
  implements ISubcircuit
{
  pcb_group_id: string | null = null
  schematic_group_id: string | null = null
  subcircuit_id: string | null = null

  _hasStartedAsyncAutorouting = false

  _asyncAutoroutingResult: {
    output_simple_route_json?: SimpleRouteJson
    output_pcb_traces?: (PcbTrace | PcbVia)[]
  } | null = null

  get config() {
    return {
      zodProps: groupProps as unknown as Props,
      componentName: "Group",
    }
  }

  doInitialSourceGroupRender() {
    const { db } = this.root!
    const hasExplicitName =
      typeof (this._parsedProps as { name?: unknown }).name === "string" &&
      (this._parsedProps as { name?: string }).name!.length > 0

    const source_group = db.source_group.insert({
      name: this.name,
      is_subcircuit: this.isSubcircuit,
      was_automatically_named: !hasExplicitName,
    })
    this.source_group_id = source_group.source_group_id
    if (this.isSubcircuit) {
      this.subcircuit_id = `subcircuit_${source_group.source_group_id}` as any
      db.source_group.update(source_group.source_group_id, {
        subcircuit_id: this.subcircuit_id!,
      })
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!

    for (const child of this.children) {
      db.source_component.update(child.source_component_id!, {
        source_group_id: this.source_group_id!,
      })
    }
  }

  doInitialSourceParentAttachment() {
    const { db } = this.root!
    const parentGroup = this.parent?.getGroup?.()
    if (parentGroup?.source_group_id) {
      db.source_group.update(this.source_group_id!, {
        parent_source_group_id: parentGroup.source_group_id,
      })
    }

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

    const groupProps = props as SubcircuitGroupProps
    const hasOutline = groupProps.outline && groupProps.outline.length > 0

    const numericOutline = hasOutline
      ? groupProps.outline!.map((point) => ({
          x: distance.parse(point.x),
          y: distance.parse(point.y),
        }))
      : undefined
    const ctx = this.props
    const anchorPosition = this._getGlobalPcbPositionBeforeLayout()
    const center = computeCenterFromAnchorPosition(anchorPosition, ctx)

    const pcb_group = db.pcb_group.insert({
      is_subcircuit: this.isSubcircuit,
      subcircuit_id: this.subcircuit_id ?? this.getSubcircuit()?.subcircuit_id!,
      name: this.name,
      anchor_position: anchorPosition,
      center,
      ...(hasOutline ? { outline: numericOutline } : { width: 0, height: 0 }),
      pcb_component_ids: [],
      source_group_id: this.source_group_id!,
      autorouter_configuration: props.autorouter
        ? {
            trace_clearance: props.autorouter.traceClearance,
          }
        : undefined,
      anchor_alignment: props.pcbAnchorAlignment ?? null,
    })
    this.pcb_group_id = pcb_group.pcb_group_id

    for (const child of this.children) {
      db.pcb_component.update(child.pcb_component_id!, {
        pcb_group_id: pcb_group.pcb_group_id,
      })
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps

    const hasOutline = props.outline && props.outline.length > 0

    if (this.pcb_group_id) {
      // Check if explicit positioning is provided (pcbX or pcbY)
      const hasExplicitPositioning =
        this._parsedProps.pcbX !== undefined ||
        this._parsedProps.pcbY !== undefined

      // If outline is specified, calculate bounds from outline
      if (hasOutline) {
        const numericOutline = props.outline!.map((point) => ({
          x: distance.parse(point.x),
          y: distance.parse(point.y),
        }))

        const outlineBounds = getBoundsFromPoints(numericOutline)
        if (!outlineBounds) return

        const centerX = (outlineBounds.minX + outlineBounds.maxX) / 2
        const centerY = (outlineBounds.minY + outlineBounds.maxY) / 2

        // Preserve explicit positioning when pcbX/pcbY are set
        // Otherwise use calculated center from outline
        const center = hasExplicitPositioning
          ? (db.pcb_group.get(this.pcb_group_id)?.center ?? {
              x: centerX,
              y: centerY,
            })
          : { x: centerX, y: centerY }

        // For groups with outline, don't set width/height
        db.pcb_group.update(this.pcb_group_id, {
          center,
        })
        return
      }

      // Original logic for groups without outline
      const bounds = getBoundsOfPcbComponents(this.children)

      let width = bounds.width
      let height = bounds.height
      let centerX = (bounds.minX + bounds.maxX) / 2
      let centerY = (bounds.minY + bounds.maxY) / 2

      if (this.isSubcircuit) {
        const { padLeft, padRight, padTop, padBottom } =
          this._resolvePcbPadding()

        width += padLeft + padRight
        height += padTop + padBottom
        centerX += (padRight - padLeft) / 2
        centerY += (padTop - padBottom) / 2
      }

      // Preserve explicit positioning when pcbX/pcbY are set
      // Otherwise use calculated center from child bounds
      const center = hasExplicitPositioning
        ? (db.pcb_group.get(this.pcb_group_id)?.center ?? {
            x: centerX,
            y: centerY,
          })
        : { x: centerX, y: centerY }

      db.pcb_group.update(this.pcb_group_id, {
        width: Number(props.width ?? width),
        height: Number(props.height ?? height),
        center,
      })
    }
  }

  unnamedElementCounter: Record<string, number> = {}
  getNextAvailableName(elm: PrimitiveComponent): string {
    this.unnamedElementCounter[elm.lowercaseComponentName] ??= 1
    return `unnamed_${elm.lowercaseComponentName}${this.unnamedElementCounter[elm.lowercaseComponentName]++}`
  }

  _resolvePcbPadding(): {
    padLeft: number
    padRight: number
    padTop: number
    padBottom: number
  } {
    const props = this._parsedProps as SubcircuitGroupProps
    const layout = props.pcbLayout

    // Helper function to get a padding value from layout or props
    const getPaddingValue = (key: string): number | undefined => {
      const layoutValue = layout?.[key as keyof typeof layout] as
        | number
        | undefined
      const propsValue = props[key as keyof typeof props] as number | undefined

      if (typeof layoutValue === "number") return layoutValue
      if (typeof propsValue === "number") return propsValue
      return undefined
    }

    const generalPadding = getPaddingValue("padding") ?? 0
    const paddingX = getPaddingValue("paddingX")
    const paddingY = getPaddingValue("paddingY")

    const padLeft = getPaddingValue("paddingLeft") ?? paddingX ?? generalPadding
    const padRight =
      getPaddingValue("paddingRight") ?? paddingX ?? generalPadding
    const padTop = getPaddingValue("paddingTop") ?? paddingY ?? generalPadding
    const padBottom =
      getPaddingValue("paddingBottom") ?? paddingY ?? generalPadding

    return { padLeft, padRight, padTop, padBottom }
  }

  doInitialCreateTraceHintsFromProps(): void {
    const { _parsedProps: props } = this
    const { db } = this.root!

    const groupProps = props as SubcircuitGroupProps

    if (!this.isSubcircuit) return

    const manualTraceHints = groupProps.manualEdits?.manual_trace_hints

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

  doInitialSourceAddConnectivityMapKey(): void {
    Group_doInitialSourceAddConnectivityMapKey(this)
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
    if (autorouter.groupMode === "sequential-trace") return false
    // Local subcircuit mode should use async routing with the CapacityMeshAutorouter
    if (autorouter.local && autorouter.groupMode === "subcircuit") return true
    // Remote autorouting always uses async
    if (!autorouter.local) return true
    return false
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

    // Remote autorouting
    const serverUrl = autorouterConfig.serverUrl!
    const serverMode = autorouterConfig.serverMode!

    const fetchWithDebug = (url: string, options: RequestInit) => {
      debug("fetching", url)
      if (options.headers) {
        // @ts-ignore
        options.headers["Tscircuit-Core-Version"] = this.root?.getCoreVersion()!
      }
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
              input_simple_route_json: getSimpleRouteJsonFromCircuitJson({
                db,
                minTraceWidth: this.props.autorouter?.minTraceWidth ?? 0.15,
                nominalTraceWidth: this.props.nominalTraceWidth,
                subcircuit_id: this.subcircuit_id,
              }).simpleRouteJson,
              subcircuit_id: this.subcircuit_id!,
            }),
            headers: {
              "Content-Type": "application/json",
            },
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
          headers: {
            "Content-Type": "application/json",
          },
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
        headers: {
          "Content-Type": "application/json",
        },
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
        const err = new AutorouterError(
          `Autorouting job failed: ${JSON.stringify(job.error)}`,
        )
        db.pcb_autorouting_error.insert({
          pcb_error_id: autorouting_job.autorouting_job_id,
          error_type: "pcb_autorouting_error",
          message: err.message,
        })
        throw err
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Run local autorouting using the CapacityMeshAutorouter
   */
  async _runLocalAutorouting() {
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps
    const debug = Debug("tscircuit:core:_runLocalAutorouting")
    debug(`[${this.getString()}] starting local autorouting`)
    const autorouterConfig = this._getAutorouterConfig()
    const isLaserPrefabPreset = this._isLaserPrefabAutorouter(autorouterConfig)
    const isSingleLayerBoard = this._getSubcircuitLayerCount() === 1
    const effort = getAutorouterEffort(props.autorouterEffortLevel)

    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      db,
      minTraceWidth: this.props.autorouter?.minTraceWidth ?? 0.15,
      nominalTraceWidth: this.props.nominalTraceWidth,
      subcircuit_id: this.subcircuit_id,
    })

    if (debug.enabled) {
      ;(global as any).debugOutputArray?.push({
        name: `simpleroutejson-${this.props.name}.json`,
        obj: simpleRouteJson,
      })
    }

    if (debug.enabled) {
      const graphicsObject = convertSrjToGraphicsObject(
        simpleRouteJson as any,
      ) as GraphicsObject
      graphicsObject.title = `autorouting-${this.props.name}`
      ;(global as any).debugGraphics?.push(graphicsObject)
    }

    this.root?.emit("autorouting:start", {
      subcircuit_id: this.subcircuit_id,
      componentDisplayName: this.getString(),
      simpleRouteJson,
    })

    // Create the autorouter instance
    let autorouter: GenericLocalAutorouter
    if (autorouterConfig.algorithmFn) {
      autorouter = await autorouterConfig.algorithmFn(simpleRouteJson)
    } else {
      autorouter = new TscircuitAutorouter(simpleRouteJson, {
        // Optional configuration parameters
        capacityDepth: this.props.autorouter?.capacityDepth,
        targetMinCapacity: this.props.autorouter?.targetMinCapacity,
        useAssignableSolver: isLaserPrefabPreset || isSingleLayerBoard,
        effort,
        onSolverStarted: ({ solverName, solverParams }) =>
          this.root?.emit("solver:started", {
            type: "solver:started",
            solverName,
            solverParams,
            componentName: this.getString(),
          }),
      })
    }

    // Create a promise that will resolve when autorouting is complete
    const routingPromise = new Promise<SimplifiedPcbTrace[]>(
      (resolve, reject) => {
        autorouter.on("complete", (event) => {
          debug(`[${this.getString()}] local autorouting complete`)
          resolve(event.traces)
        })

        autorouter.on("error", (event) => {
          debug(
            `[${this.getString()}] local autorouting error: ${event.error.message}`,
          )
          reject(event.error)
        })
      },
    )

    autorouter.on("progress", (event) => {
      this.root?.emit("autorouting:progress", {
        subcircuit_id: this.subcircuit_id,
        componentDisplayName: this.getString(),
        ...event,
      })
    })

    // Start the autorouting process
    autorouter.start()

    try {
      // Wait for the autorouting to complete
      const traces = await routingPromise

      // Create source_traces for interconnect ports that were connected via
      // off-board paths during routing. This allows DRC to understand that
      // these ports are intentionally connected.
      if (autorouter.getConnectedOffboardObstacles) {
        const connectedOffboardObstacles =
          autorouter.getConnectedOffboardObstacles()
        createSourceTracesFromOffboardConnections({
          db,
          connectedOffboardObstacles,
          simpleRouteJson,
          subcircuit_id: this.subcircuit_id,
        })
      }

      // Store the result
      this._asyncAutoroutingResult = {
        output_pcb_traces: traces as any,
      }

      // Mark the component as needing to re-render the PCB traces
      this._markDirty("PcbTraceRender")
    } catch (error) {
      const { db } = this.root!
      // Record the error
      db.pcb_autorouting_error.insert({
        pcb_error_id: `pcb_autorouter_error_subcircuit_${this.subcircuit_id}`,
        error_type: "pcb_autorouting_error",
        message: error instanceof Error ? error.message : String(error),
      })

      this.root?.emit("autorouting:error", {
        subcircuit_id: this.subcircuit_id,
        componentDisplayName: this.getString(),
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
        simpleRouteJson,
      })

      throw error
    } finally {
      // Ensure the autorouter is stopped
      autorouter.stop()
    }
  }

  _startAsyncAutorouting() {
    if (this._hasStartedAsyncAutorouting) return
    this._hasStartedAsyncAutorouting = true
    if (this._getAutorouterConfig().local) {
      this._queueAsyncEffect("capacity-mesh-autorouting", async () =>
        this._runLocalAutorouting(),
      )
    } else {
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

  doInitialSchematicTraceRender() {
    Group_doInitialSchematicTraceRender(this as any)
  }

  updatePcbTraceRender() {
    const debug = Debug("tscircuit:core:updatePcbTraceRender")
    debug(`[${this.getString()}] updating...`)
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
      debug(
        `[${this.getString()}] updating PCB traces from simple route json (${this._asyncAutoroutingResult.output_simple_route_json.traces?.length} traces)`,
      )
      this._updatePcbTraceRenderFromSimpleRouteJson()
      return
    }

    if (this._asyncAutoroutingResult.output_pcb_traces) {
      debug(
        `[${this.getString()}] updating PCB traces from ${this._asyncAutoroutingResult.output_pcb_traces.length} traces`,
      )
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
    // const circuitTraces = this.selectAll("trace") as Trace[]
    for (const routedTrace of routedTraces) {
      // const circuitTrace = circuitTraces.find(
      //   (t) => t.source_trace_id === routedTrace.,
      // )

      // Create the PCB trace with the routed path
      // TODO use upsert to make sure we're not re-creating traces
      const pcb_trace = db.pcb_trace.insert({
        subcircuit_id: this.subcircuit_id!,
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
      //       layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
      //       from_layer: point.from_layer as LayerRef,
      //       to_layer: point.to_layer as LayerRef,
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
    const pcbStyle = this.getInheritedMergedProperty("pcbStyle")
    const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)

    for (const pcb_trace of output_pcb_traces) {
      // vias can be included
      if (pcb_trace.type !== "pcb_trace") continue
      pcb_trace.subcircuit_id = this.subcircuit_id!

      if ((pcb_trace as any).connection_name) {
        const sourceTraceId = (pcb_trace as any).connection_name
        pcb_trace.source_trace_id = sourceTraceId
      }

      db.pcb_trace.insert(pcb_trace)
    }

    // Create vias for layer transitions (this shouldn't be necessary, but
    // the Circuit JSON spec is ambiguous as to whether a via should have a
    // separate element from the route)
    for (const pcb_trace of output_pcb_traces) {
      if (pcb_trace.type === "pcb_via") {
        // TODO handling here- may need to handle if redundant with pcb_trace
        // below (i.e. don't insert via if one already exists at that location)
        continue
      }
      if (pcb_trace.type === "pcb_trace") {
        for (const point of pcb_trace.route) {
          if (point.route_type === "via") {
            db.pcb_via.insert({
              pcb_trace_id: pcb_trace.pcb_trace_id,
              x: point.x,
              y: point.y,
              hole_diameter: holeDiameter,
              outer_diameter: padDiameter,
              layers: [
                point.from_layer as LayerRef,
                point.to_layer as LayerRef,
              ],
              from_layer: point.from_layer as LayerRef,
              to_layer: point.to_layer as LayerRef,
            })
          }
        }
      }
    }
  }

  doInitialSchematicComponentRender() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const schematic_group = db.schematic_group.insert({
      is_subcircuit: this.isSubcircuit,
      subcircuit_id: this.subcircuit_id!,
      name: this.name,
      center: this._getGlobalSchematicPositionBeforeLayout(),
      width: 0,
      height: 0,
      schematic_component_ids: [],
      source_group_id: this.source_group_id!,
    })
    this.schematic_group_id = schematic_group.schematic_group_id

    for (const child of this.children) {
      if (child.schematic_component_id) {
        db.schematic_component.update(child.schematic_component_id, {
          schematic_group_id: schematic_group.schematic_group_id,
        })
      }
    }
  }

  _getSchematicLayoutMode(): "match-adapt" | "flex" | "grid" | "relative" {
    const props = this._parsedProps as SubcircuitGroupProps
    if (props.schLayout?.layoutMode === "none") return "relative"
    if (props.schLayout?.layoutMode === "relative") return "relative"
    if (props.schLayout?.matchAdapt) return "match-adapt"
    if (props.schLayout?.flex) return "flex"
    if (props.schLayout?.grid) return "grid"
    if (props.schMatchAdapt) return "match-adapt"
    if (props.schFlex) return "flex"
    if (props.schGrid) return "grid"
    if (props.matchAdapt) return "match-adapt"
    if (props.flex) return "flex"
    if (props.grid) return "grid"
    if (props.relative) return "relative"
    if (props.schRelative) return "relative"
    // If no layout method has been defined, fall back to match-adapt
    // unless any direct child defines schX or schY
    const anyChildHasSchCoords = this.children.some((child) => {
      const cProps = (child as any)._parsedProps
      return cProps?.schX !== undefined || cProps?.schY !== undefined
    })
    const hasManualEdits =
      (props.manualEdits?.schematic_placements?.length ?? 0) > 0

    // Use match-adapt if no explicit positioning is set, even with group children
    // This allows nested groups to be laid out properly
    if (!anyChildHasSchCoords && !hasManualEdits) return "match-adapt"
    return "relative"
  }

  doInitialSchematicLayout(): void {
    // The schematic_components are rendered in our children
    const schematicLayoutMode = this._getSchematicLayoutMode()

    if (schematicLayoutMode === "match-adapt") {
      this._doInitialSchematicLayoutMatchpack()
    }
    if (schematicLayoutMode === "grid") {
      this._doInitialSchematicLayoutGrid()
    }
    if (schematicLayoutMode === "flex") {
      this._doInitialSchematicLayoutFlex()
    }

    this._insertSchematicBorder()
  }

  _doInitialSchematicLayoutMatchAdapt(): void {
    Group_doInitialSchematicLayoutMatchAdapt(this as any)
  }

  _doInitialSchematicLayoutMatchpack(): void {
    Group_doInitialSchematicLayoutMatchPack(this as any)
  }

  _doInitialSchematicLayoutGrid(): void {
    Group_doInitialSchematicLayoutGrid(this)
  }

  _doInitialSchematicLayoutFlex(): void {
    Group_doInitialSchematicLayoutFlex(this as any)
  }

  _getPcbLayoutMode(): "grid" | "flex" | "match-adapt" | "pack" | "none" {
    const props = this._parsedProps as SubcircuitGroupProps
    if (props.pcbRelative) return "none"
    if (props.pcbLayout?.matchAdapt) return "match-adapt"
    if (props.pcbLayout?.flex) return "flex"
    if (props.pcbLayout?.grid) return "grid"
    if (props.pcbLayout?.pack) return "pack"

    if (props.pcbFlex) return "flex"
    if (props.pcbGrid) return "grid"
    if (props.pcbPack) return "pack"
    if (props.pack) return "pack"
    if (props.matchAdapt) return "match-adapt"

    if (props.flex) return "flex"
    if (props.grid) return "grid"

    // Default to pcbPack when there are multiple direct children without explicit
    // pcb coordinates and no manual edits are present. Relatively positioned
    // components (with pcbX/pcbY) will be excluded from packing, while others
    // will be packed together.
    const groupHasCoords = props.pcbX !== undefined || props.pcbY !== undefined
    const hasManualEdits = (props.manualEdits?.pcb_placements?.length ?? 0) > 0

    const unpositionedDirectChildrenCount = this.children.reduce(
      (count, child) => {
        // Skip net components - they don't have physical PCB components
        if (!child.pcb_component_id && !(child as Group).pcb_group_id) {
          return count
        }

        const childProps = child._parsedProps
        const hasCoords =
          childProps?.pcbX !== undefined || childProps?.pcbY !== undefined
        return count + (hasCoords ? 0 : 1)
      },
      0,
    )

    if (!hasManualEdits && unpositionedDirectChildrenCount > 1) return "pack"
    return "none"
  }

  doInitialPcbLayout(): void {
    if (this.root?.pcbDisabled) return

    // Position the group itself if pcbX/pcbY are provided
    if (this.pcb_group_id) {
      const { db } = this.root!
      const props = this._parsedProps

      const hasExplicitPcbPosition =
        props.pcbX !== undefined || props.pcbY !== undefined

      if (hasExplicitPcbPosition) {
        const parentGroup = this.parent?.getGroup?.()
        const pcbParentGroupId = parentGroup?.pcb_group_id
          ? db.pcb_group.get(parentGroup.pcb_group_id)?.pcb_group_id
          : undefined

        const positionedRelativeToBoardId = !pcbParentGroupId
          ? (this._getBoard()?.pcb_board_id ?? undefined)
          : undefined

        db.pcb_group.update(this.pcb_group_id, {
          position_mode: "relative_to_group_anchor",
          positioned_relative_to_pcb_group_id: pcbParentGroupId,
          positioned_relative_to_pcb_board_id: positionedRelativeToBoardId,
          display_offset_x: props.pcbX,
          display_offset_y: props.pcbY,
        })
      }
    }

    const pcbLayoutMode = this._getPcbLayoutMode()

    if (pcbLayoutMode === "grid") {
      this._doInitialPcbLayoutGrid()
    } else if (pcbLayoutMode === "pack") {
      this._doInitialPcbLayoutPack()
    } else if (pcbLayoutMode === "flex") {
      this._doInitialPcbLayoutFlex()
    }
  }

  _doInitialPcbLayoutGrid(): void {
    Group_doInitialPcbLayoutGrid(this)
  }

  _doInitialPcbLayoutPack(): void {
    Group_doInitialPcbLayoutPack(this as any)
  }

  _doInitialPcbLayoutFlex(): void {
    Group_doInitialPcbLayoutFlex(this as any)
  }

  _insertSchematicBorder() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as SubcircuitGroupProps

    if (!props.border) return

    let width: number | undefined =
      typeof props.schWidth === "number" ? props.schWidth : undefined
    let height: number | undefined =
      typeof props.schHeight === "number" ? props.schHeight : undefined

    const paddingGeneral =
      typeof props.schPadding === "number" ? props.schPadding : 0
    const paddingLeft =
      typeof props.schPaddingLeft === "number"
        ? props.schPaddingLeft
        : paddingGeneral
    const paddingRight =
      typeof props.schPaddingRight === "number"
        ? props.schPaddingRight
        : paddingGeneral
    const paddingTop =
      typeof props.schPaddingTop === "number"
        ? props.schPaddingTop
        : paddingGeneral
    const paddingBottom =
      typeof props.schPaddingBottom === "number"
        ? props.schPaddingBottom
        : paddingGeneral

    const schematicGroup = this.schematic_group_id
      ? db.schematic_group.get(this.schematic_group_id)
      : null
    if (schematicGroup) {
      if (width === undefined && typeof schematicGroup.width === "number") {
        width = schematicGroup.width
      }
      if (height === undefined && typeof schematicGroup.height === "number") {
        height = schematicGroup.height
      }
    }

    if (width === undefined || height === undefined) return

    const center =
      schematicGroup?.center ?? this._getGlobalSchematicPositionBeforeLayout()

    const left = center.x - width / 2 - paddingLeft
    const bottom = center.y - height / 2 - paddingBottom

    const finalWidth = width + paddingLeft + paddingRight
    const finalHeight = height + paddingTop + paddingBottom

    db.schematic_box.insert({
      width: finalWidth,
      height: finalHeight,
      x: left,
      y: bottom,
      is_dashed: props.border?.dashed ?? false,
    })
  }

  _determineSideFromPosition(
    port: SchematicPort,
    component: SchematicComponent,
  ): "left" | "right" | "top" | "bottom" {
    if (!port.center || !component.center) return "left"

    const dx = port.center.x - component.center.x
    const dy = port.center.y - component.center.y

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left"
    }
    return dy > 0 ? "bottom" : "top"
  }

  _calculateSchematicBounds(
    boxes: Array<{ centerX: number; centerY: number }>,
  ): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    if (boxes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const box of boxes) {
      minX = Math.min(minX, box.centerX)
      maxX = Math.max(maxX, box.centerX)
      minY = Math.min(minY, box.centerY)
      maxY = Math.max(maxY, box.centerY)
    }

    // Add some padding
    const padding = 2
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    }
  }

  _getAutorouterConfig(): AutorouterConfig {
    const autorouter =
      this._parsedProps.autorouter || this.getInheritedProperty("autorouter")
    return getPresetAutoroutingConfig(autorouter)
  }

  _isLaserPrefabAutorouter(
    autorouterConfig: AutorouterConfig = this._getAutorouterConfig(),
  ): boolean {
    const autorouterProp = this.props.autorouter
    const normalize = (value?: string) => value?.replace(/-/g, "_") ?? value
    if (autorouterConfig.preset === "laser_prefab") return true
    if (typeof autorouterProp === "string") {
      return normalize(autorouterProp) === "laser_prefab"
    }
    if (typeof autorouterProp === "object" && autorouterProp) {
      return normalize(autorouterProp.preset) === "laser_prefab"
    }
    return false
  }

  _getSubcircuitLayerCount(): number {
    const layers = this.getInheritedProperty("layers")
    return typeof layers === "number" ? layers : 2
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

  doInitialPcbDesignRuleChecks() {
    if (this.root?.pcbDisabled) return
    if (this.getInheritedProperty("routingDisabled")) return
    const { db } = this.root!

    if (this.isSubcircuit) {
      const subcircuitComponentsByName = new Map<string, PrimitiveComponent[]>()

      for (const child of this.children) {
        // Skip if child is itself a subcircuit
        if ((child as any).isSubcircuit) continue

        if (child._parsedProps.name) {
          const components =
            subcircuitComponentsByName.get(child._parsedProps.name) || []
          components.push(child)
          subcircuitComponentsByName.set(child._parsedProps.name, components)
        }
      }

      for (const [name, components] of subcircuitComponentsByName.entries()) {
        if (components.length > 1) {
          db.pcb_trace_error.insert({
            error_type: "pcb_trace_error",
            message: `Multiple components found with name "${name}" in subcircuit "${this.name || "unnamed"}". Component names must be unique within a subcircuit.`,
            source_trace_id: "",
            pcb_trace_id: "",
            pcb_component_ids: components
              .map((c) => c.pcb_component_id!)
              .filter(Boolean),
            pcb_port_ids: [],
          })
        }
      }
    }
  }

  doInitialSchematicReplaceNetLabelsWithSymbols() {
    if (this.root?.schematicDisabled) return
    if (!this.isSubcircuit) return
    const { db } = this.root!

    // TODO remove when circuit-json-util supports subtree properly
    // const subtree = db.subtree({ subcircuit_id: this.subcircuit_id! })
    const subtree = db

    for (const nl of subtree.schematic_net_label.list()) {
      const net = subtree.source_net.get(nl.source_net_id)
      const text = nl.text || net?.name || ""

      if (nl.anchor_side === "top" && /^gnd/i.test(text)) {
        subtree.schematic_net_label.update(nl.schematic_net_label_id, {
          symbol_name: "rail_down",
        })
        continue
      }

      if (nl.anchor_side === "bottom" && /^v/i.test(text)) {
        subtree.schematic_net_label.update(nl.schematic_net_label_id, {
          symbol_name: "rail_up",
        })
      }
    }
  }

  doInitialSimulationSpiceEngineRender() {
    Group_doInitialSimulationSpiceEngineRender(this)
  }

  /**
   * Override anchor alignment to handle group-specific logic
   */
  doInitialPcbComponentAnchorAlignment(): void {
    Group_doInitialPcbComponentAnchorAlignment(this)
  }

  updatePcbComponentAnchorAlignment(): void {
    this.doInitialPcbComponentAnchorAlignment()
  }

  /**
   * Get the minimum flex container size for this group on PCB
   */
  _getMinimumFlexContainerSize() {
    return super._getMinimumFlexContainerSize()
  }

  /**
   * Reposition this group on the PCB to the specified coordinates
   */
  _repositionOnPcb(position: { x: number; y: number }) {
    return super._repositionOnPcb(position)
  }
}
