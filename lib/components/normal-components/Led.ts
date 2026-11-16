import { fp } from "@tscircuit/footprinter"
import {
  type PartsEngine,
  type SupplierPartNumbers,
  ledProps,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import {
  type AnyCircuitElement,
  source_part_not_found_warning,
} from "circuit-json"
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
import type { FabricationNotePath } from "../primitive-components/FabricationNotePath"
import type { FabricationNoteText } from "../primitive-components/FabricationNoteText"
import type { Port } from "../primitive-components/Port"
import { resolvePortSourcePinAttributes } from "../primitive-components/Port/resolve-port-source-pin-attributes"
import type { SilkscreenPath } from "../primitive-components/SilkscreenPath"

const POLARITY_ALIASES = new Set(["anode", "pos", "cathode", "neg"])
const POLARITY_ARTWORK_COMPONENT_NAMES = new Set([
  "SilkscreenPath",
  "FabricationNotePath",
  "FabricationNoteText",
])
const POLARITY_ARTWORK_ELEMENT_TYPES = new Set([
  "pcb_silkscreen_path",
  "pcb_fabrication_note_path",
  "pcb_fabrication_note_text",
])

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

  _addChildrenFromStringFootprint() {
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

  initPorts() {
    this._hasExplicitPortChildren ??= this.children.some(
      (child) => child.componentName === "Port",
    )
    super.initPorts(getDiodePortOptions(this))
  }

  private _shouldAdoptSupplierPin1Polarity(): {
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

    if (this._parsedProps.pinLabels || this.props.pinLabels) return null
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

  private _applyImpliedPin1Polarity(targetPin1Polarity: Pin1Polarity) {
    this._impliedFootprintPinLabels =
      targetPin1Polarity === "cathode"
        ? { pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }
        : { pin1: ["anode", "pos"], pin2: ["cathode", "neg"] }

    for (const port of this._getAllPortsFromChildren()) {
      const pinNumber = port._parsedProps.pinNumber
      if (pinNumber !== 1 && pinNumber !== 2) continue

      if (Array.isArray(port._parsedProps.aliases)) {
        port._parsedProps.aliases = port._parsedProps.aliases.filter(
          (alias: string) => !POLARITY_ALIASES.has(alias),
        )
      }
      if (Array.isArray(port.props.aliases)) {
        port.props.aliases = port.props.aliases.filter(
          (alias: string) => !POLARITY_ALIASES.has(alias),
        )
      }
      port.externallyAddedAliases = port.externallyAddedAliases.filter(
        (alias) => !POLARITY_ALIASES.has(alias),
      )
      if (
        port._parsedProps.name &&
        POLARITY_ALIASES.has(port._parsedProps.name)
      ) {
        port._parsedProps.name = `pin${pinNumber}`
      }
      port.schematicSymbolPortDef = null
    }

    this.initPorts()

    const { db } = this.root!
    for (const port of this._getAllPortsFromChildren()) {
      if (!port.source_port_id) continue
      db.source_port.update(port.source_port_id, {
        name: port.physicalPinName ?? port._parsedProps.name!,
        port_hints: port.getNameAndAliases(),
        do_not_connect: false,
        ...resolvePortSourcePinAttributes(port),
      })
    }

    for (const child of [...(this._stringFootprintChildren ?? [])]) {
      if (!POLARITY_ARTWORK_COMPONENT_NAMES.has(child.componentName)) continue
      if (
        child.componentName === "SilkscreenPath" &&
        (child as SilkscreenPath).pcb_silkscreen_path_id
      ) {
        db.pcb_silkscreen_path.delete(
          (child as SilkscreenPath).pcb_silkscreen_path_id!,
        )
      }
      if (
        child.componentName === "FabricationNotePath" &&
        (child as FabricationNotePath).fabrication_note_path_id
      ) {
        db.pcb_fabrication_note_path.delete(
          (child as FabricationNotePath).fabrication_note_path_id!,
        )
      }
      if (
        child.componentName === "FabricationNoteText" &&
        (child as FabricationNoteText).pcb_fabrication_note_text_id
      ) {
        db.pcb_fabrication_note_text.delete(
          (child as FabricationNoteText).pcb_fabrication_note_text_id!,
        )
      }
      this.remove(child)
    }
    this._stringFootprintChildren = (
      this._stringFootprintChildren ?? []
    ).filter(
      (child) => !POLARITY_ARTWORK_COMPONENT_NAMES.has(child.componentName),
    )

    const resolvedFootprint = this.resolveFootprint()
    if (typeof resolvedFootprint === "string") {
      try {
        const fpCircuitJson = (
          fp.string(resolvedFootprint).soup() as AnyCircuitElement[]
        ).filter((element) => POLARITY_ARTWORK_ELEMENT_TYPES.has(element.type))
        const newArtworkComponents = createComponentsFromCircuitJson(
          {
            sourcePortOwner: this,
            componentName: this.name ?? this.componentName,
            componentRotation: String(this.props.pcbRotation ?? 0),
            footprinterString: resolvedFootprint,
            pinLabels: this._resolvePinLabels(),
          },
          fpCircuitJson,
        )
        this.addAll(newArtworkComponents)
        this._stringFootprintChildren.push(...newArtworkComponents)
      } catch {}
    }

    this.getSubcircuit()?._markDirty("OptimizeSelectorCache")
  }

  doInitialFetchPartFootprint(): void {
    if (this._hasStartedSupplierPolarityResolution) return
    const resolutionContext = this._shouldAdoptSupplierPin1Polarity()
    if (!resolutionContext) return

    this._hasStartedSupplierPolarityResolution = true
    const { partsEngine, baseFootprint } = resolutionContext
    const footprint = this.props.footprint ?? this._getImpliedFootprintString()
    const footprinterString =
      typeof footprint === "string" ? footprint : undefined

    this._queueAsyncEffect("resolve-led-supplier-polarity", async () => {
      // Yield one microtask so Cycle 1 finishes SourceRender and populates source_component_id.
      await Promise.resolve()
      if (!this.root) return
      const { db } = this.root
      const sourceComponent = this.source_component_id
        ? db.source_component.get(this.source_component_id)
        : undefined
      if (!sourceComponent) return

      let supplierPartNumbers: SupplierPartNumbers | undefined =
        sourceComponent.supplier_part_numbers
      if (!supplierPartNumbers) {
        try {
          supplierPartNumbers = await this._getSupplierPartNumbers(
            partsEngine,
            sourceComponent,
            footprinterString,
          )
          this._asyncSupplierPartNumbers = supplierPartNumbers
          db.source_component.update(sourceComponent.source_component_id, {
            supplier_part_numbers: supplierPartNumbers,
          })
        } catch (error: any) {
          this._asyncSupplierPartNumbers = {}
          db.source_component.update(sourceComponent.source_component_id, {
            supplier_part_numbers: {},
          })
          const warning = source_part_not_found_warning.parse({
            type: "source_part_not_found_warning",
            message: `Failed to fetch supplier part numbers for ${this.getString()}: ${error.message}`,
            source_component_id: sourceComponent.source_component_id,
            subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
            manufacturer_part_number:
              sourceComponent.manufacturer_part_number ?? undefined,
            part_name: sourceComponent.name ?? undefined,
          })
          db.source_part_not_found_warning.insert(warning)
          return
        }
      }

      const supplierCandidates = getSupplierPartCandidates(supplierPartNumbers)
      if (supplierCandidates.length === 0) return

      const inferredPolarities = new Set<Pin1Polarity>()
      for (const supplierPartCandidate of supplierCandidates) {
        try {
          const { pin1Polarity } = await analyzeSupplierPartOrientation({
            component: this,
            partsEngine,
            supplierPartCandidate,
          })
          if (pin1Polarity) inferredPolarities.add(pin1Polarity)
        } catch {}
      }

      if (inferredPolarities.size !== 1) return
      const [targetPin1Polarity] = inferredPolarities
      const defaultTerminals = resolveDiodeFootprint(baseFootprint, {
        name: this.name ?? "Led",
      })
      const defaultPin1Polarity: Pin1Polarity =
        defaultTerminals.positivePin === 1 ? "anode" : "cathode"
      if (targetPin1Polarity !== defaultPin1Polarity) {
        this._applyImpliedPin1Polarity(targetPin1Polarity!)
      }
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
