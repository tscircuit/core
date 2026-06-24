---
name: tscircuit-terminology
description: Look up the meaning of a tscircuit autorouting or circuit-representation term — e.g. connectivity map, capacity mesh node, SimpleRouteJson (SRJ) subtypes like SimpleRouteConnection ("single connect"), or the subcircuit_connectivity_map_key. Use whenever you encounter an unfamiliar tscircuit identifier in the autorouter, core, or circuit-json and need its precise definition and whether it is public API or internal.
---

# tscircuit Standard Terminology

A shared glossary of the standard terms used across tscircuit's autorouting and
circuit-representation code. It spans the autorouter (`@tscircuit/capacity-autorouter`),
core (`tscircuit/core`), and the `circuit-json-to-connectivity-map` helper library.
Use it to pin down what a term means, where it is defined, and whether it is part of
the public API or an internal implementation detail.

## How to read this

Each entry gives the exact identifier in `code font`, a one-sentence plain-language
definition, and where it is defined. Every term is tagged:

- **PUBLIC** — part of a published API surface: exported by the autorouter's
  `dist/index.d.ts`, exported by a helper package, or a `circuit-json` field that
  other tools may read/write. Safe to depend on.
- **INTERNAL** — an implementation detail: a type or class that is reachable but not
  named in a package's export list, an `_`-prefixed private field, or a core utility
  that is central but not published as API. May drift between versions; do not depend
  on it from outside.

> Rule of thumb for the autorouter: a name in the top-level `export { ... }` of
> `dist/index.d.ts` is PUBLIC. Types that are only transitively reachable (e.g. solver
> output shapes) are INTERNAL even though you can observe them. `_`-prefixed fields are
> always INTERNAL private state.

Source citations point at the file where a term is defined. Autorouter citations are
against the published `@tscircuit/capacity-autorouter` `dist/index.d.ts`; core citations
are against paths in `tscircuit/core`.

---

## Headline terms (read these first)

- **`ConnectivityMap`** (PUBLIC, `circuit-json-to-connectivity-map`) — a union-find-style
  map of which ids (ports/traces/nets) belong to the same electrical net. The
  conventional instance variable name is **`connMap`**.
- **`CapacityMeshNode`** (INTERNAL, autorouter) — one cell of the capacity-mesh routing
  grid: a rectangle with a routing capacity. The autorouter subdivides the board into a
  quadtree of these nodes, connects them as a graph, and finds paths through them.
- **`SimpleRouteConnection`** (PUBLIC, autorouter) — the "single connect" / single-trace
  unit of routing intent: one named connection with a list of `pointsToConnect`.
- **`subcircuit_connectivity_map_key`** (PUBLIC, `circuit-json` field) — a string tag on
  source/pcb elements identifying which connected net within which subcircuit an element
  belongs to. Format: `` `${subcircuitName ?? "unnamedsubcircuit<id>"}_${connNetId}` ``.

---

## Category 1 — SimpleRouteJson (SRJ): the autorouter I/O format

`SimpleRouteJson` (SRJ) is the autorouter's input and output container: board params +
obstacles + connections + bounds, with `traces` populated on output. PUBLIC — re-exported
by the autorouter and re-declared/extended in core.

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `SimpleRouteJson` | Top-level autorouter I/O object: board params, obstacles, connections, bounds; `traces` filled on output. | autorouter `dist/index.d.ts:96`; core `lib/utils/autorouting/SimpleRouteJson.ts:91` | PUBLIC |
| `layerCount` | Number of copper layers on the board (e.g. 2). | `dist/index.d.ts:97` | PUBLIC |
| `minTraceWidth` | Minimum routed trace width (mm). | `dist/index.d.ts:98` | PUBLIC |
| `nominalTraceWidth` | Preferred/default trace width when not otherwise constrained. | `dist/index.d.ts:99` | PUBLIC |
| `minViaDiameter` (deprecated) / `minViaPadDiameter` / `minViaHoleDiameter` / `min_via_pad_diameter` / `min_via_hole_diameter` | Via sizing design rules; snake_case and camelCase both accepted. `minViaDiameter` is deprecated in favor of `minViaPadDiameter`. | `dist/index.d.ts:100-105` | PUBLIC |
| `defaultObstacleMargin` | Default clearance margin applied around obstacles. | `dist/index.d.ts:106` | PUBLIC |
| `minTraceToPadEdgeClearance` | Minimum clearance from a trace to a pad edge. | `dist/index.d.ts:107` | PUBLIC |
| `obstacles` | Array of `Obstacle` rectangles the router must avoid. | `dist/index.d.ts:108` | PUBLIC |
| `connections` | Array of `SimpleRouteConnection` (the nets/traces to route). | `dist/index.d.ts:109` | PUBLIC |
| `bounds` | Routing area `{minX,maxX,minY,maxY}`. | `dist/index.d.ts:110` | PUBLIC |
| `outline` | Optional board outline polygon `[{x,y}]`. | `dist/index.d.ts:116` | PUBLIC |
| `traces` (`SimplifiedPcbTraces`) | Output routed traces; optional on input (e.g. pre-routed copper passed in). | `dist/index.d.ts:120` | PUBLIC |
| `jumpers` / `allowJumpers` / `availableJumperTypes` | Jumper-based routing for single-layer boards; `availableJumperTypes` defaults to `["0603"]`. | `dist/index.d.ts:121-124` | PUBLIC |

### Connections — the "single connect" / single-trace family

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `SimpleRouteConnection` | One thing to route: a named connection with `pointsToConnect`. The "single connect" unit of routing intent. | `dist/index.d.ts:146`; core `SimpleRouteJson.ts:65` | PUBLIC |
| `name` | Connection/net name; for traces, typically the `source_trace_id`. | `dist/index.d.ts:147` | PUBLIC |
| `rootConnectionName` (`RootConnectionName`) | The original net/connection name a (possibly fragmented or merged) connection belongs to. | `dist/index.d.ts:148, 62` | PUBLIC |
| `mergedConnectionNames` | Names of connections merged into this one (net merging). | `dist/index.d.ts:149` | PUBLIC |
| `isOffBoard` | Connection crosses off the board (internal/off-board connection). | `dist/index.d.ts:150` | PUBLIC |
| `netConnectionName` | The net-level name for this connection. | `dist/index.d.ts:151` | PUBLIC |
| `pointsToConnect` (`ConnectionPoint`) | Ordered terminals to connect; each is a `SingleLayerConnectionPoint` or `MultiLayerConnectionPoint`. | `dist/index.d.ts:153, 83` | PUBLIC |
| `externallyConnectedPointIds` (deprecated) | Point-id groups already connected by external copper. | `dist/index.d.ts:155` | PUBLIC (deprecated) |
| `SingleLayerConnectionPoint` | A terminal `{x,y,layer, pointId?, pcb_port_id?, terminalVia?}`. | `dist/index.d.ts:67` | PUBLIC |
| `MultiLayerConnectionPoint` | A terminal spanning `layers[]`, optionally with `busId`. | `dist/index.d.ts:75` | PUBLIC |
| `terminalVia` (`TerminalViaHint`) | Hint that a terminal must drop a via to `toLayer` at a given `viaDiameter`. | `dist/index.d.ts:63, 73` | PUBLIC |
| `busId` (`BusId`) | Identifier grouping connection points belonging to the same bus. | `dist/index.d.ts:58, 80` | PUBLIC |

### Obstacles

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `Obstacle` | An axis-aligned `rect` region (optional rotation) the router must avoid; carries `connectedTo`, copper-pour and off-board metadata. | `dist/index.d.ts:126`; core `SimpleRouteJson.ts:48`; built in core `lib/utils/obstacles/getObstaclesFromCircuitJson.ts` | PUBLIC |
| `connectedTo` | Trace/net ids the obstacle's copper already belongs to (same-net copper is treated as connectable). | `dist/index.d.ts:141` | PUBLIC |
| `isCopperPour` | Obstacle represents a copper pour/fill region. | `dist/index.d.ts:142` | PUBLIC |
| `netIsAssignable` | Obstacle's net can be assigned during routing (used for internal connections). | `dist/index.d.ts:143` | PUBLIC |
| `offBoardConnectsTo` (`OffBoardConnectionId`) | Internal-connection ids the obstacle connects to off-board. | `dist/index.d.ts:144, 60` | PUBLIC |
| `zLayers` / `layers` | Copper layer membership (string layer names; numeric z indices). | `dist/index.d.ts:131-132` | PUBLIC |
| `ccwRotationDegrees` | Counter-clockwise rotation of the obstacle rect. | `dist/index.d.ts:140` | PUBLIC |

### Output traces

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `SimplifiedPcbTrace` / `SimplifiedPcbTraces` | A routed trace: `type:"pcb_trace"`, `pcb_trace_id`, `connection_name`, and a `route[]` of segments. | `dist/index.d.ts:157, 205`; core `SimpleRouteJson.ts:6` | PUBLIC |
| `route_type:"wire"` | Straight copper segment `{x,y,width,layer}`. | `dist/index.d.ts:162` | PUBLIC |
| `route_type:"via"` | Layer transition `{x,y,from_layer,to_layer,via_diameter?,via_hole_diameter?}`. | `dist/index.d.ts:168` | PUBLIC |
| `route_type:"jumper"` | Jumper crossover segment `{start,end,footprint,layer}` (single-layer boards). | `dist/index.d.ts:176` | PUBLIC |
| `route_type:"through_obstacle"` | Segment that intentionally passes through an obstacle `{start,end,from_layer,to_layer,width}`. | `dist/index.d.ts:191` | PUBLIC |

### ID scalar types

`TraceId`, `NetId`, `BusId`, `PointId`, `OffBoardConnectionId`, `ObstacleId`,
`RootConnectionName`, `CapacityMeshNodeId`, `CapacityPathId` — all `string` aliases
(`dist/index.d.ts:56-62, 207, 242`). PUBLIC where used in public types, but mostly
opaque string tags.

---

## Category 2 — Capacity Mesh concepts

The autorouter is a "capacity mesh" / hypergraph router: it subdivides the board into a
quadtree of cells (mesh nodes), each with a routing **capacity**, connects them as a
graph, finds paths through cells, then does high-density intra-node routing.

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `CapacityMeshNode` | One cell of the routing mesh: a rectangle with center/size/layer, an `availableZ` set, and internal `_`-prefixed annotations. | `dist/index.d.ts:208` | INTERNAL (produced by solvers; not in export list) |
| `capacityMeshNodeId` (`CapacityMeshNodeId`) | Unique id of a mesh node. | `dist/index.d.ts:207, 209` | INTERNAL |
| `availableZ` | Which z (layer index) values are usable inside the node. | `dist/index.d.ts:217` | INTERNAL |
| `_depth` | Quadtree subdivision depth of the node. | `dist/index.d.ts:218` | INTERNAL (`_` = private state) |
| `_completelyInsideObstacle` / `_containsObstacle` / `_containsTarget` | Node-obstacle/target overlap flags. | `dist/index.d.ts:219-221` | INTERNAL |
| `_targetConnectionName` | Connection name of the target this node contains. | `dist/index.d.ts:222` | INTERNAL |
| `_strawNode` / `_strawParentCapacityMeshNodeId` | "Straw" nodes are thin pass-through nodes created by `StrawSolver`. | `dist/index.d.ts:223-224` | INTERNAL |
| `_isVirtualOffboard` / `_offboardNetName` / `_offBoardConnectionId` / `_offBoardConnectedCapacityMeshNodeIds` | Virtual nodes representing off-board connections. | `dist/index.d.ts:225-229` | INTERNAL |
| `_qfpRegionType` / `_isNarrowQfpPadGap` / `_soicRegionType` | Footprint-aware region tags (QFP/SOIC pad / pad-gap / corner / center) for finer meshing near dense parts. | `dist/index.d.ts:230-232` | INTERNAL |
| `CapacityMeshEdge` | Adjacency between two mesh nodes `nodeIds:[id,id]`; may be an off-board edge. | `dist/index.d.ts:235` | INTERNAL |
| `CapacityPath` | A path of mesh node ids a connection routes through; carries `connectionName` and fragmentation flags. | `dist/index.d.ts:243` | INTERNAL |
| `isFragmentedPath` / `mstPairConnectionName` | Path was split at an off-board edge; MST-pairing name before fragmentation. | `dist/index.d.ts:248-251` | INTERNAL |
| `capacityDepth` | Quadtree subdivision depth for capacity planning (auto-computed if omitted). | `dist/index.d.ts:5100`; README | PUBLIC (solver option) |
| `targetMinCapacity` | Target minimum cell capacity used to auto-derive `capacityDepth` (default 0.5; lower → finer). | `dist/index.d.ts:5101`; README | PUBLIC (solver option) |
| `calculateOptimalCapacityDepth` | Helper computing optimal `capacityDepth` from board size + `targetMinCapacity`. | exported, `dist/index.d.ts:6805` | PUBLIC |
| `getTunedTotalCapacity1` / `getCapacityFromDepth` | Capacity-from-depth tuning functions. | export list; `dist/index.d.ts:2793` | PUBLIC (`getTunedTotalCapacity1`) / INTERNAL (`getCapacityFromDepth`) |
| `effort` / `maxNodeDimension` / `maxNodeRatio` / `minNodeArea` | Pipeline tuning options controlling mesh granularity and search effort. | `dist/index.d.ts:5103-5106` | PUBLIC (solver option) |

### Port points & segments (mesh-to-route handoff)

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `PortPoint` | A point where a connection crosses a node boundary `{connectionName,x,y,z, prev/nextPortPointId}`; links nodes into routable paths. | `dist/index.d.ts:254` | INTERNAL |
| `NodeWithPortPoints` | A mesh node plus the `portPoints[]` (and `portPointsInPairs`) routed through it. | `dist/index.d.ts:264` | INTERNAL |
| `NodePortSegment` | A segment along one node edge that one or more connections pass through `{start,end,availableZ,connectionNames}`. | `dist/index.d.ts:2683` | INTERNAL |
| `Target` | A routing goal point `{x,y,bounds,connectionName,availableZ}`. | `dist/index.d.ts:2749` | INTERNAL |
| `TargetTree` | Spatial bucket index over targets for fast lookup. | `dist/index.d.ts:2737` | INTERNAL |

### High-density (intra-node) routing

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `HighDensityRoute` / `HighDensityIntraNodeRoute` | The detailed wire path within a single mesh node: `route[]` of `{x,y,z}` plus `vias[]`; z is the integer layer index (z=0 top, z=1 bottom for 2-layer). | `dist/index.d.ts:290, 2470, 310`; re-exported | PUBLIC (re-exported) |
| `traceThickness` / `viaDiameter` | Geometry of a high-density route. | `dist/index.d.ts:293-294` | PUBLIC |
| `vias` | Via locations placed wherever the route changes z. | `dist/index.d.ts:303` | PUBLIC |
| `HighDensityIntraNodeRouteWithJumpers` | Variant using jumpers instead of vias on single-layer PCBs. | `dist/index.d.ts:335` | PUBLIC |
| `Jumper` | A jumper component crossover `{route_type:"jumper",start,end,footprint}`; footprints `"0603"`, `"1206"`, `"1206x4_pair"`. | `dist/index.d.ts:317` | PUBLIC |
| `JumperType` | `"1206x4" \| "0603"`. | `dist/index.d.ts:95` | PUBLIC |

---

## Category 3 — Solver pipeline & framework

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `AutoroutingPipelineSolver` | The main public solver (alias of `AutoroutingPipelineSolver4_TinyHypergraph`). Construct with SRJ, call `step()` until `solved`/`failed`, then `getOutputSimpleRouteJson()`. | `dist/index.d.ts:5115`, export :6805; README | PUBLIC |
| `CapacityMeshSolver` | Public-named capacity-mesh solver entry; takes `{capacityDepth,targetMinCapacity}`. | `dist/index.d.ts:2623` (options :2609), export | PUBLIC |
| `BaseSolver` | Base class for all solvers: `step()`/`_step()`, `solved`, `failed`, `progress`, `iterations`, `error`, `activeSubSolver`, `visualize()`, `preview()`, `solve()`. | `dist/index.d.ts:352` | INTERNAL (not exported, but the universal pattern) |
| `step()` / `solve()` / `solved` / `failed` / `error` | Iterative solver loop contract: call `step()` repeatedly (or `solve()`) until `solved` or `failed`; `error` holds the failure string. | `dist/index.d.ts:355-375`; README | PUBLIC behavior |
| `visualize()` / `preview()` | Return a `GraphicsObject` (graphics-debug) of current state; `preview` is the lightweight streaming version. | `dist/index.d.ts:376, 387` | PUBLIC |
| `getOutputSimpleRouteJson()` | Returns the input SRJ with `traces` populated. | `dist/index.d.ts:5172`; README | PUBLIC |
| `getOutputSimplifiedPcbTraces()` | Returns just the routed `SimplifiedPcbTraces`. | `dist/index.d.ts:5171` | PUBLIC |
| `pipelineDef` / `PipelineStep` | The ordered list of pipeline stages, each `{solverName,solverClass,getConstructorParams}`. | `dist/index.d.ts:5160, 5109` | INTERNAL |
| `getCurrentPhase()` / `solveUntilPhase()` / `timeSpentOnPhase` | Phase introspection of the pipeline. | `dist/index.d.ts:5166-5167, 5150` | PUBLIC methods |
| `CacheProvider` / `CachableSolver` / `InMemoryCache` / `LocalStorageCache` / `setupGlobalCaches` / `getGlobalInMemoryCache` / `getGlobalLocalStorageCache` | High-density route caching layer; `cacheHit`/`cacheKey` on solvers. | exports; `dist/index.d.ts:367-369, 5780, 5826` | PUBLIC |

### Pipeline stage solvers (the canonical stage vocabulary, in order)

From `AutoroutingPipelineSolver4`, all INTERNAL stage classes (`dist/index.d.ts:5116-5160`):

`PreprocessSimpleRouteJsonSolver` → `EscapeViaLocationSolver` →
`NetToPointPairsSolver` (`NetToPointPairsSolver2_OffBoardConnection`) →
`CapacityMeshNodeSolver` (node/mesh generation; `RectDiffPipeline` /
`NodeDimensionSubdivisionSolver`) → `CapacityNodeTargetMerger` →
`CapacityMeshEdgeSolver` (`...2_NodeTreeOptimization`) → `AvailableSegmentPointSolver` →
`MultiTargetNecessaryCrampedPortPointSolver` → `TinyHypergraphPortPointPathingSolver`
(port-point pathing) → `UniformPortDistributionSolver` → `HighDensitySolver`
(intra-node routing) → `HighDensityForceImproveSolver` → `Pipeline4HighDensityRepairSolver`
→ `MultipleHighDensityRouteStitchSolver3` (stitch) → `TraceSimplificationSolver` →
`TraceWidthSolver` → `GlobalDrcForceImproveSolver`.

Other notable stage/solver classes (`dist/index.d.ts:534-6757`, all INTERNAL):
`CapacityPathingSolver` / `...Greedy` / `...MultiSection` (path through mesh),
`CapacityEdgeToPortSegmentSolver`, `CapacitySegmentToPointSolver`, `StrawSolver`,
`DeadEndSolver`, `SingleLayerNodeMergerSolver`, `UselessViaRemovalSolver`,
`UnravelSectionSolver` / `UnravelMultiSectionSolver`, `IntraNodeRouteSolver`
(+ jumper/curvy/poly variants), `SingleHighDensityRouteSolver`.

| Helper | Definition | Defined | Tag |
|--------|-----------|---------|-----|
| `convertSrjToGraphicsObject` | Convert an SRJ to a graphics-debug visualization object. | export :6805 | PUBLIC |
| `getRerouteSimpleRouteJson` / `reconnectReroutedSimpleRouteJsonRegion` / `RerouteRectRegion` | Extract a sub-region of an SRJ for partial rerouting and stitch the result back. | export :6805 | PUBLIC |
| `DrcError` / `DrcEvaluator` / `DrcSnapshot` / `GlobalDrcForceImproveSolver` | Design-Rule-Check evaluation and force-improvement of routes. | re-exported, `dist/index.d.ts:14` | PUBLIC |

---

## Category 4 — Connectivity map & subcircuit keys

Mostly from `circuit-json-to-connectivity-map` plus core.

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `ConnectivityMap` | Union-find-style map of which ids (ports/traces/nets) belong to the same electrical net. Methods: `addConnections`, `getIdsConnectedToNet`, `getNetConnectedToId`, `areIdsConnected`, `areAllIdsConnected`; fields `netMap`, `idToNetMap`. | `circuit-json-to-connectivity-map dist/index.d.ts:6` | PUBLIC (own package) |
| `connMap` | Conventional variable name for a `ConnectivityMap` instance throughout core and the autorouter pipeline. | autorouter `dist/index.d.ts:5152`; core `getSimpleRouteJsonFromCircuitJson.ts:105` | convention |
| `findConnectedNetworks` | Given `[[id,id],...]` connections, returns `{connectivity_netN: [ids...]}`. | `circuit-json-to-connectivity-map dist/index.d.ts:4` | PUBLIC |
| `connectivity_net0`, `connectivity_net3`, … | The generated net-group keys returned by `findConnectedNetworks` / `getNetConnectedToId`. | that lib's README | PUBLIC (string convention) |
| `getFullConnectivityMapFromCircuitJson` | Build a `ConnectivityMap` from full circuit JSON. Used by core to build SRJ. | lib `dist/index.d.ts:19`; core `getSimpleRouteJsonFromCircuitJson.ts:6,105` | PUBLIC |
| `getSourcePortConnectivityMapFromCircuitJson` | Build a connectivity map keyed by source ports. | lib `dist/index.d.ts:17` | PUBLIC |
| `PcbConnectivityMap` | Connectivity map of what PCB traces/ports are *physically* connected (post-routing), for finding the nearest connected net point. Methods `areTracesConnected`, `getAllTracesConnectedToPort`, etc. | lib `dist/index.d.ts:28` | PUBLIC |
| `subcircuit_connectivity_map_key` / `SubcircuitConnectivityMapKey` | A string tag on `source_trace`/`source_port`/`source_net`/`Via` identifying which connected net within which subcircuit an element belongs to. Format: `` `${subcircuitName ?? "unnamedsubcircuit<id>"}_${connNetId}` ``. Keeps per-subcircuit net identity stable across autorouting. | core `lib/components/primitive-components/Group/Group_doInitialSourceAddConnectivityMapKey.ts:49,71,73,100,107,119`; `circuit-json` field | PUBLIC (circuit-json field) |
| `connNetId` | The connectivity-net id (`connectivity_netN`) for an element, used as the suffix of the subcircuit connectivity map key. | core `Group_doInitialSourceAddConnectivityMapKey.ts:47,69,97` | INTERNAL (local) |
| `Group_doInitialSourceAddConnectivityMapKey` | Core render step that computes and stamps `subcircuit_connectivity_map_key` on all traces/ports/nets/vias in a subcircuit. | core `lib/components/primitive-components/Group/Group_doInitialSourceAddConnectivityMapKey.ts:7` | INTERNAL (core impl) |

---

## Category 5 — Core circuit-representation / SRJ-construction terms

| Term | Definition | Defined | Tag |
|------|-----------|---------|-----|
| `getSimpleRouteJsonFromCircuitJson` | Core util converting circuit JSON (post PcbTraceRender) into `{ simpleRouteJson, connMap }` for the autorouter. | core `lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson.ts:21` | INTERNAL (core, central but not published API) |
| `getObstaclesFromCircuitJson` | Builds SRJ `Obstacle[]` from pcb_smtpad/plated_hole/hole/via/keepout/cutout/component, using the connMap. | core `lib/utils/obstacles/getObstaclesFromCircuitJson.ts` | INTERNAL |
| `getUnbrokenCopperPourObstacles` | Produces copper-pour obstacles that are not broken by the connMap. | core `lib/utils/autorouting/getUnbrokenCopperPourObstacles.ts` | INTERNAL |
| `source_trace` / `source_port` / `source_net` | circuit-json "source" (schematic-level/logical) elements; carry `connected_source_port_ids`, `connected_source_net_ids`, and `subcircuit_connectivity_map_key`. | core `getSimpleRouteJsonFromCircuitJson.ts`, `Group_doInitialSourceAddConnectivityMapKey.ts` | PUBLIC (circuit-json) |
| `pcb_trace` / `pcb_port` / `pcb_smtpad` / `pcb_plated_hole` / `pcb_via` / `pcb_keepout` / `pcb_cutout` / `pcb_board` / `pcb_group` | circuit-json "pcb" (physical-layout) elements; geometric counterparts of source elements. | core `getSimpleRouteJsonFromCircuitJson.ts:113-119, 211` | PUBLIC (circuit-json) |
| `pcb_breakout_point` / breakout point | A point on a subcircuit boundary where a cross-boundary trace hands off between inner and outer autorouter runs. | core `getSimpleRouteJsonFromCircuitJson.ts:107,328,491` | PUBLIC (circuit-json) |
| `pcb_trace_hint` (`traceHints`) | User-provided waypoints inserted into a connection's `pointsToConnect`. | core `getSimpleRouteJsonFromCircuitJson.ts:62,377` | PUBLIC (circuit-json) |
| `subcircuit_id` / `source_group_id` | Identifies the subcircuit (Group) an element belongs to; autorouting runs per-subcircuit. | core `getSimpleRouteJsonFromCircuitJson.ts:39,86`; `Group.ts` | PUBLIC (circuit-json) |
| `source_component_internal_connection` | A declared internal connection inside a component (drives `offBoardConnectsTo` / `netIsAssignable`). | core `getSimpleRouteJsonFromCircuitJson.ts:198` | PUBLIC (circuit-json) |
| `connection_name` | On a `SimplifiedPcbTrace`, the net/connection a routed trace belongs to (often the `source_trace_id`). | core `SimpleRouteJson.ts:8,18`; autorouter `dist/index.d.ts:160` | PUBLIC |
| `route` (segment array) | Ordered geometry of a trace (wire/via/jumper/through_obstacle segments). | core `SimpleRouteJson.ts:13`; autorouter `dist/index.d.ts:161` | PUBLIC |
| `isCopperPour` / copper pour obstacle | A filled copper region treated as an obstacle unless on the same net. | core `getUnbrokenCopperPourObstacles.ts`; autorouter `dist/index.d.ts:142` | PUBLIC |
| `layer` / `pcbX` / `pcbY` (`x`,`y` in pcb space) | Physical layer name (e.g. "top", "bottom") and PCB coordinates of points/segments. | throughout SRJ types | PUBLIC |
| schematic vs pcb (`source_*` vs `pcb_*`) | tscircuit separates logical/schematic "source" elements from physical "pcb" layout elements; autorouting consumes pcb geometry but uses source connectivity for nets. | core convention, `getSimpleRouteJsonFromCircuitJson.ts` | PUBLIC concept |

---

## Caveats

- Autorouter line numbers reference the published `@tscircuit/capacity-autorouter`
  `dist/index.d.ts` (`0.0.607`). Internal (non-exported) class names match source class
  names but may drift from `main`.
- `circuit-json` field-level types (e.g. the exact shape of `source_trace`) are
  authoritatively defined in the `circuit-json` package; here they are described as
  observed through core usage and the connectivity-map library.
