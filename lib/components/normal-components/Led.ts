import { fp } from "@tscircuit/footprinter"
import {
  type PartsEngine,
  ledProps,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type {
  BaseSymbolName,
  Ftype,
  PolarizedPassivePorts,
} from "lib/utils/constants"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getDiodePortOptions } from "lib/utils/footprints/get-diode-port-options"
import { parseFootprinterDefinition } from "lib/utils/footprints/parse-footprinter-definition"
import { resolveDiodeFootprint } from "lib/utils/footprints/resolve-diode-footprint"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import {
  type Pin1Polarity,
  analyzeSupplierPartOrientation,
  getSupplierPartCandidates,
} from "../base-components/NormalComponent/NormalComponent_doInitialPartOrientationAnalysis"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "../primitive-components/Port"
import { resolvePortSourcePinAttributes } from "../primitive-components/Port/resolve-port-source-pin-attributes"

const POLARITY_ALIASES = new Set(["anode", "pos", "cathode", "neg"])
const PIN_LABELS_BY_PIN1_POLARITY = {
  anode: { pin1: ["anode", "pos"], pin2: ["cathode", "neg"] },
  cathode: { pin1: ["cathode", "neg"], pin2: ["anode", "pos"] },
} satisfies Record<Pin1Polarity, Record<string, string[]>>
/** Polarity artwork component -> [db table, id field] to clear when replacing it. */
const POLARITY_ARTWORK_DB_IDS: Record<string, readonly [string, string]> = {
  SilkscreenPath: ["pcb_silkscreen_path", "pcb_silkscreen_path_id"],
  FabricationNotePath: [
    "pcb_fabrication_note_path",
    "fabrication_note_path_id",
  ],
  FabricationNoteText: [
    "pcb_fabrication_note_text",
    "pcb_fabrication_note_text_id",
  ],
}
const POLARITY_ARTWORK_ELEMENT_TYPES = new Set(
  Object.values(POLARITY_ARTWORK_DB_IDS).map(([table]) => table),
)
const isPolarityArtwork = (child: PrimitiveComponent): boolean =>
  child.componentName in POLARITY_ARTWORK_DB_IDS

export class Led extends NormalComponent<
  typeof ledProps,
  PolarizedPassivePorts
> {
  private declare _hasExplicitPortChildren?: boolean
  private declare _hasStartedSupplierPolarityResolution?: boolean
  private declare _stringFootprintChildren?: PrimitiveComponent[]

  resolveFootprint() {
    const footprint = super.resolveFootprint()
    if (!isFootprinterString(footprint)) return footprint
    return resolveDiodeFootprint(footprint, {
      name: this.name ?? "Led",
      pinLabels: this._resolvePinLabels(),
    }).footprint
  }

  _addChildrenFromStringFootprint(): void {
    const existingChildren = new Set(this.children)
    super._addChildrenFromStringFootprint()
    this._stringFootprintChildren = this.children.filter(
      (child) => !existingChildren.has(child),
    )
  }

  get config() {
    const symbolMap: Record<string, BaseSymbolName> = {
      laser: "laser_diode",
    }

    const variantSymbol = this.props.laser ? "laser" : null

    const baseSymbolName = variantSymbol
      ? symbolMap[variantSymbol]
      : (this.props.symbolName ?? "led")
    const compactSize =
      this.props.schSize === "sm" || this.props.schSize === "xs"
        ? this.props.schSize
        : undefined
    const compactSymbolName =
      compactSize && baseSymbolName === "led" ? `led_${compactSize}` : undefined
    const schematicSymbolName =
      compactSymbolName && `${compactSymbolName}_right` in symbols
        ? compactSymbolName
        : baseSymbolName

    return {
      schematicSymbolName,
      componentName: "Led",
      zodProps: ledProps,
      sourceFtype: "simple_led" as Ftype,
    }
  }

  add(component: Parameters<NormalComponent["add"]>[0]): void {
    // JSX ports arrive after the constructor generated defaults; generated ports
    // carry an originDescription, authored ones do not.
    if (
      "componentName" in component &&
      component.componentName === "Port" &&
      !(component as Port).originDescription
    ) {
      this._hasExplicitPortChildren = true
    }
    super.add(component)
  }

  initPorts() {
    super.initPorts(getDiodePortOptions(this))
  }

  private _getSupplierPolarityContext(): {
    partsEngine: PartsEngine
    baseFootprint: string
  } | null {
    if (!this.root || this.root.pcbDisabled || this.props.doNotPlace) {
      return null
    }
    if (this.root.platform?.enablePartOrientationAnalysis === false) return null
    if (this.getInheritedProperty("bomDisabled")) return null
    if (this.getInheritedProperty("partsEngineDisabled")) return null

    const partsEngine = this.getInheritedProperty("partsEngine") as
      | PartsEngine
      | undefined
    if (!partsEngine?.fetchPartCircuitJson) return null
    if (!this._parsedProps.supplierPartNumbers && !partsEngine.findPart) {
      return null
    }

    if (this._parsedProps.pinLabels) return null
    if (this._hasExplicitPortChildren) return null
    if (this.children.some((child) => child.componentName === "Footprint")) {
      return null
    }

    const baseFootprint = super.resolveFootprint()
    if (!isFootprinterString(baseFootprint)) return null
    const parsed = parseFootprinterDefinition(baseFootprint)
    if (
      !parsed ||
      parsed.parameters.anodepin !== undefined ||
      parsed.parameters.cathodepin !== undefined
    ) {
      return null
    }

    return { partsEngine, baseFootprint }
  }

  /** Returns the replacement artwork, or null if the footprint cannot be rebuilt. */
  private _buildPolarityArtwork(): PrimitiveComponent[] | null {
    const resolvedFootprint = this.resolveFootprint()
    if (typeof resolvedFootprint !== "string") return null
    try {
      const fpCircuitJson = (
        fp.string(resolvedFootprint).soup() as AnyCircuitElement[]
      ).filter((element) => POLARITY_ARTWORK_ELEMENT_TYPES.has(element.type))
      return createComponentsFromCircuitJson(
        {
          sourcePortOwner: this,
          componentName: this.name ?? this.componentName,
          componentRotation: String(this.props.pcbRotation ?? 0),
          footprinterString: resolvedFootprint,
          pinLabels: this._resolvePinLabels(),
        },
        fpCircuitJson,
      )
    } catch {
      return null
    }
  }

  private _relabelPolarityPorts(): void {
    const isPolarityPin = (port: Port): boolean =>
      port._parsedProps.pinNumber === 1 || port._parsedProps.pinNumber === 2
    const withoutPolarity = (aliases: string[]): string[] =>
      aliases.filter((alias) => !POLARITY_ALIASES.has(alias))

    for (const port of this._getAllPortsFromChildren().filter(isPolarityPin)) {
      port.resolvedNameAndAliases = {
        name: `pin${port._parsedProps.pinNumber}`,
        aliases: withoutPolarity(port.getNameAndAliases()),
      }
      port.externallyAddedAliases = withoutPolarity(port.externallyAddedAliases)
      port.schematicSymbolPortDef = null
    }

    this.initPorts()

    const { db } = this.root!
    for (const port of this._getAllPortsFromChildren()) {
      if (!port.source_port_id) continue
      db.source_port.update(port.source_port_id, {
        name: port.physicalPinName ?? port.name!,
        port_hints: port.getNameAndAliases(),
        do_not_connect: false,
        ...resolvePortSourcePinAttributes(port),
      })
    }
  }

  private _replacePolarityArtwork(newArtwork: PrimitiveComponent[]): void {
    const db = this.root!.db as unknown as Record<
      string,
      { delete: (id: string) => void }
    >
    const oldArtwork = (this._stringFootprintChildren ?? []).filter(
      isPolarityArtwork,
    )
    for (const child of oldArtwork) {
      const [table, idField] = POLARITY_ARTWORK_DB_IDS[child.componentName]!
      const id = (child as unknown as Record<string, string | undefined>)[
        idField
      ]
      if (id) db[table]!.delete(id)
      this.remove(child)
    }

    this._stringFootprintChildren = [
      ...(this._stringFootprintChildren ?? []).filter(
        (child) => !isPolarityArtwork(child),
      ),
      ...newArtwork,
    ]
    this.addAll(newArtwork)
  }

  private _applyImpliedPin1Polarity(targetPin1Polarity: Pin1Polarity): void {
    const previousPinLabels = this._impliedFootprintPinLabels
    this._impliedFootprintPinLabels =
      PIN_LABELS_BY_PIN1_POLARITY[targetPin1Polarity]

    const newArtwork = this._buildPolarityArtwork()
    if (!newArtwork) {
      this._impliedFootprintPinLabels = previousPinLabels
      return
    }

    this._relabelPolarityPorts()
    this._replacePolarityArtwork(newArtwork)
    this.getSubcircuit()?._markDirty("OptimizeSelectorCache")
  }

  /** The single pin-1 polarity every supplier candidate agrees on, if any. */
  private async _inferSupplierPin1Polarity(
    partsEngine: PartsEngine,
  ): Promise<Pin1Polarity | null> {
    const supplierPartNumbers =
      await this._resolveSupplierPartNumbers(partsEngine)
    const supplierCandidates = getSupplierPartCandidates(supplierPartNumbers)

    const inferredPolarities = new Set<Pin1Polarity>()
    for (const supplierPartCandidate of supplierCandidates) {
      const analysis = await analyzeSupplierPartOrientation({
        component: this,
        partsEngine,
        supplierPartCandidate,
      }).catch(() => null)
      if (analysis?.pin1Polarity) inferredPolarities.add(analysis.pin1Polarity)
    }

    if (inferredPolarities.size !== 1) return null
    return [...inferredPolarities][0]!
  }

  doInitialFetchPartFootprint(): void {
    if (this._hasStartedSupplierPolarityResolution) return
    const context = this._getSupplierPolarityContext()
    if (!context) return

    this._hasStartedSupplierPolarityResolution = true
    const { partsEngine, baseFootprint } = context
    this._queueAsyncEffect("resolve-led-supplier-polarity", async () => {
      // Yield one microtask so Cycle 1 finishes SourceRender and populates source_component_id.
      await Promise.resolve()
      if (!this.root) return

      // Polarity determines connectivity, so supplier latency must not choose
      // which physical pin receives a net. Keep dependent layout phases pending
      // until inference finishes rather than treating a timeout as unknown polarity.
      const targetPin1Polarity =
        await this._inferSupplierPin1Polarity(partsEngine)
      if (!targetPin1Polarity) return

      const { positivePin } = resolveDiodeFootprint(baseFootprint, {
        name: this.name ?? "Led",
      })
      const defaultPin1Polarity = positivePin === 1 ? "anode" : "cathode"
      if (targetPin1Polarity === defaultPin1Polarity) return
      this._applyImpliedPin1Polarity(targetPin1Polarity)
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return (
      this._parsedProps.schDisplayValue || this._parsedProps.color || undefined
    )
  }

  getFootprinterString(): string | null {
    const baseFootprint = super.getFootprinterString()
    if (baseFootprint && this.props.color) {
      return `${baseFootprint}_color(${this.props.color})`
    }
    return baseFootprint
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_led",
      name: this.name,
      wave_length: props.wavelength,
      color: props.color,
      symbol_display_value: this._getSchematicSymbolDisplayValue(),
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  get pos(): Port {
    return this.portMap.pos
  }

  get anode(): Port {
    return this.portMap.anode
  }

  get neg(): Port {
    return this.portMap.neg
  }

  get cathode(): Port {
    return this.portMap.cathode
  }
}
