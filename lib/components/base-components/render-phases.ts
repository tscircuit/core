export const orderedRenderPhases = [
  "ReactSubtreesRender",
  "RenderIsolatedSubcircuits",
  "InflateSubcircuitCircuitJson",
  "SourceNameDuplicateComponentRemoval",
  "PcbFootprintStringRender",
  "FetchPartFootprint",
  "ResolveFootprintPinLabels",
  "InitializePortsFromChildren",
  "CreateNetsFromProps",
  "AssignFallbackProps",
  "CreateTracesFromProps",
  "CreateTracesFromNetLabels",
  "CreateTraceHintsFromProps",
  "CreateAutoplacedBreakoutPoints",
  "SourceGroupRender",
  "AssignNameToUnnamedComponents",
  "SourceRender",
  "CheckRefDesConvention",
  "SourceComponentPropertyValidation",
  "SourceParentAttachment",
  "PortMatching",
  "OptimizeSelectorCache",
  "SourceTraceRender",
  "SourceAddConnectivityMapKey",
  "SourceDesignRuleChecks",
  "SimulationRender",
  "SchematicComponentRender",
  "SchematicPortRender",
  "SymbolContainerRender",
  "SchematicPrimitiveRender",
  "SchematicSymbolResize",
  "SchematicComponentSizeCalculation",
  "SchematicLayout",
  "SchematicSectionRender",
  "SchematicTraceRender",
  "SchematicSheetRender",
  "SchematicReplaceNetLabelsWithSymbols",
  "SchematicLabelNetsWithConflictingNames",
  "PanelBoardLayout",
  "ValidatePcbCoordinates",
  "PcbComponentRender",
  "PcbPrimitiveRender",
  "PcbFootprintLayout",
  "PcbPortRender",
  "PcbPortAttachment",
  "PcbComponentSizeCalculation",
  "PcbComponentAnchorAlignment",
  "PcbCalcPlacementResolution",
  "PcbLayout",
  "PcbBoardAutoSize",
  "PanelLayout",
  "PcbFlexRender",
  "PcbAutoplaceBreakoutPoints",
  "PcbTraceHintRender",
  "PcbManualTraceRender",
  "PcbPlacementDesignRuleChecks",
  "PcbTraceRender",
  "PcbRouteNetIslands",
  "PcbTraceTeardropRender",
  "PcbCopperPourRender",
  "PcbViaStitchRender",
  "PcbCopperPourCleanup",
  "PcbSimulationRender",
  "PcbDesignRuleChecks",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "DrawingRender",
  "PartsEngineRender",
  "MissingManufacturerPartNumberWarning",
  "ComponentAvailabilityWarning",
  "PartOrientationAnalysis",
  "SupplierFootprintMismatchWarning",
  "SimulationSpiceEngineRender",
] as const

export type RenderPhase = (typeof orderedRenderPhases)[number]

export const renderPhaseIndexMap = new Map<RenderPhase, number>(
  orderedRenderPhases.map((phase, index) => [phase, index]),
)

export type RenderPhaseFn<K extends RenderPhase = RenderPhase> =
  | `doInitial${K}`
  | `update${K}`
  | `remove${K}`

export type RenderPhaseStates = Record<
  RenderPhase,
  {
    initialized: boolean
    dirty: boolean
  }
>

export type AsyncEffect = {
  asyncEffectId: string
  effectName: string
  promise: Promise<void>
  phase: RenderPhase
  complete: boolean
}

export type RenderPhaseFunctions = {
  [T in RenderPhaseFn]?: () => void
}

export type IRenderable = RenderPhaseFunctions & {
  renderPhaseStates: RenderPhaseStates
  runRenderPhase(phase: RenderPhase): void
  runRenderPhaseForChildren(phase: RenderPhase): void
  shouldBeRemoved: boolean
  children: IRenderable[]
  runRenderCycle(): void
}
