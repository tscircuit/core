import {
  type ConnectorProps,
  type ConnectorStandard,
  type PartsEngine,
  type SchematicPinStyle,
  type SchematicPortArrangement,
  connectorProps,
} from "@tscircuit/props"
import type { AnyCircuitElement, SourceSimpleConnector } from "circuit-json"
import { source_part_not_found_warning } from "circuit-json"
import { convertCircuitJsonToJstStandardCircuitJson } from "lib/utils/connectors/convertCircuitJsonToJstStandardCircuitJson"
import { convertCircuitJsonToUsbCStandardCircuitJson } from "lib/utils/connectors/convertCircuitJsonToUsbCStandardCircuitJson"
import { extractCadModelFromCircuitJson } from "lib/utils/connectors/extractCadModelFromCircuitJson"
import { STANDARD_USB_C_PIN_LABELS } from "lib/utils/connectors/usb-c-canonical-pin-definitions"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { inferCableInsertionCenterForComponent } from "lib/utils/pcb/infer-cable-insertion-center-for-component"
import {
  type SchematicBoxDimensions,
  getAllDimensionsForSchematicBox,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { getNumericSchPinStyle } from "lib/utils/schematic/getNumericSchPinStyle"
import { symbols } from "schematic-symbols"
import { Port } from "../primitive-components/Port"
import { Chip } from "./Chip"
import { insertInnerSymbolInSchematicBox } from "./Connector_insertInnerSymbolInSchematicBox"

const USB_C_SIGNAL_LABELS_IN_ORDER = [
  "VBUS1",
  "VBUS2",
  "CC1",
  "CC2",
  "DP1",
  "DP2",
  "DM1",
  "DM2",
  "SBU1",
  "SBU2",
  "GND1",
  "GND2",
] as const

const USB_C_SHELL_LABELS_IN_ORDER = [
  "SHELL1",
  "SHELL2",
  "SHELL3",
  "SHELL4",
] as const

const USB_C_CANONICAL_LABELS_IN_ORDER = [
  ...USB_C_SIGNAL_LABELS_IN_ORDER,
  ...USB_C_SHELL_LABELS_IN_ORDER,
] as const

type UsbCCanonicalLabel = (typeof USB_C_CANONICAL_LABELS_IN_ORDER)[number]

const USB_C_CANONICAL_LABELS = new Set<string>([
  ...USB_C_CANONICAL_LABELS_IN_ORDER,
])

const JST_CONNECTOR_STANDARDS = new Set<ConnectorStandard>([
  "jst_sh",
  "jst_gh",
  "jst_zh",
  "jst_ph",
  "jst_xh",
  "jst_vh",
])

const isJstConnectorStandard = (
  standard: ConnectorStandard | undefined,
): boolean => standard !== undefined && JST_CONNECTOR_STANDARDS.has(standard)

type SinglePinStyle = NonNullable<SchematicPinStyle[string]>
const USB_C_DEFAULT_SCH_PIN_STYLE_BY_LABEL: ReadonlyArray<
  readonly [UsbCCanonicalLabel, SinglePinStyle]
> = [
  // Group spacing on right side
  ["CC1", { marginTop: 0.15 }],
  ["DP1", { marginTop: 0.15 }],
  ["SBU1", { marginTop: 0.15 }],
  ["GND1", { marginTop: 0.15 }],
  // Bottom-side label spacing uses horizontal margins.
  ["SHELL4", { marginRight: 0.15 }],
]

export class Connector<
  PinLabels extends string = never,
> extends Chip<PinLabels> {
  private _getConnectorProps(): ConnectorProps {
    return this._parsedProps as ConnectorProps
  }

  initPorts(): void {
    const props = this._getConnectorProps()
    super.initPorts({
      pinCount: isJstConnectorStandard(props.standard)
        ? props.pinCount
        : undefined,
    })
  }

  private _hasExplicitFootprint(): boolean {
    const props = this._getConnectorProps()
    return (
      props.footprint !== undefined ||
      this.children.some((child) => child.componentName === "Footprint")
    )
  }

  private _shouldUseStandardPartsEngineCircuitJsonFlow(): boolean {
    const props = this._getConnectorProps()
    if (!props.standard) return false
    if (this._hasExplicitFootprint()) return false
    if (this.getInheritedProperty("partsEngineDisabled")) return false
    return true
  }

  private _addUsbCCanonicalFallbackPorts(): void {
    if (this.selectAll("port").length > 0) return

    this.addAll(
      STANDARD_USB_C_PIN_LABELS.map(
        ({ label, aliases }, pinIndex) =>
          new Port({
            pinNumber: pinIndex + 1,
            name: label,
            aliases: [...aliases],
          }),
      ),
    )
    this._markDirty("InitializePortsFromChildren")
  }

  private _handleStandardConnectorCircuitJsonFailure(
    standard: ConnectorStandard,
    message: string,
  ): void {
    const { db } = this.root!
    const warning = source_part_not_found_warning.parse({
      type: "source_part_not_found_warning",
      message: `Failed to fetch circuit JSON for ${this.getString()} (standard="${standard}"): ${message}`,
      source_component_id: this.source_component_id ?? undefined,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
      manufacturer_part_number:
        this._getConnectorProps().manufacturerPartNumber ??
        this._getConnectorProps().mfn ??
        undefined,
      part_name: this.name,
    })
    db.source_part_not_found_warning.insert(warning)

    if (standard === "usb_c") {
      this._addUsbCCanonicalFallbackPorts()
    }
  }

  private _getSupplierPartNumbersToTry(
    supplierPartNumbers: Record<string, string[] | undefined> | undefined,
  ): string[] {
    const partNumbers: string[] = []
    for (const supplier of Object.keys(supplierPartNumbers ?? {})) {
      const nums = supplierPartNumbers?.[supplier]
      if (Array.isArray(nums) && nums.length > 0) {
        partNumbers.push(nums[0])
      }
    }
    return partNumbers
  }

  private async _tryFetchPartCircuitJson(
    fetchPartCircuitJson: NonNullable<PartsEngine["fetchPartCircuitJson"]>,
    params: { supplierPartNumber?: string; manufacturerPartNumber?: string },
  ): Promise<AnyCircuitElement[] | null> {
    const maybeCircuitJson =
      (await Promise.resolve(fetchPartCircuitJson(params))) ?? null
    if (Array.isArray(maybeCircuitJson) && maybeCircuitJson.length > 0) {
      return maybeCircuitJson
    }
    return null
  }

  private async _fetchStandardConnectorCircuitJson(
    fetchPartCircuitJson: NonNullable<PartsEngine["fetchPartCircuitJson"]>,
    supplierPartNumbers: Record<string, string[] | undefined> | undefined,
    manufacturerPartNumber?: string,
  ): Promise<AnyCircuitElement[] | null> {
    for (const supplierPartNumber of this._getSupplierPartNumbersToTry(
      supplierPartNumbers,
    )) {
      const circuitJson = await this._tryFetchPartCircuitJson(
        fetchPartCircuitJson,
        { supplierPartNumber },
      )
      if (circuitJson) return circuitJson
    }

    if (!manufacturerPartNumber) return null

    return this._tryFetchPartCircuitJson(fetchPartCircuitJson, {
      manufacturerPartNumber,
    })
  }

  private _addConnectorFootprintFromCircuitJson(
    standard: ConnectorStandard,
    circuitJson: AnyCircuitElement[],
  ): void {
    const props = this._getConnectorProps()
    const standardizedCircuitJson =
      standard === "usb_c"
        ? convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)
        : isJstConnectorStandard(standard)
          ? convertCircuitJsonToJstStandardCircuitJson(
              circuitJson,
              props.pinCount ?? 0,
            )
          : circuitJson

    const fpComponents = createComponentsFromCircuitJson(
      {
        componentName: this.name,
        componentRotation: String(props.pcbRotation ?? 0),
        footprinterString: `standard:${standard}`,
        pinLabels: props.pinLabels,
        pcbPinLabels: props.pcbPinLabels,
      },
      standardizedCircuitJson,
    )

    const fetchedCadModel = extractCadModelFromCircuitJson(
      standardizedCircuitJson,
    )
    if (fetchedCadModel) {
      this._asyncFootprintCadModel = fetchedCadModel
    }

    this.addAll(fpComponents)
    this._markDirty("InitializePortsFromChildren")
  }

  private _getUsbCCanonicalLabelToPinNumberMap(): Map<
    UsbCCanonicalLabel,
    number
  > {
    const labelToPinNumber = new Map<UsbCCanonicalLabel, number>()
    const ports = this.selectAll("port") as Port[]

    for (const port of ports) {
      const pinNumber = port.props.pinNumber
      if (typeof pinNumber !== "number") continue

      for (const alias of port.getNameAndAliases()) {
        const normalizedAlias = alias.trim().toUpperCase()
        if (!USB_C_CANONICAL_LABELS.has(normalizedAlias)) continue
        const label = normalizedAlias as UsbCCanonicalLabel
        if (!labelToPinNumber.has(label)) {
          labelToPinNumber.set(label, pinNumber)
        }
      }
    }

    return labelToPinNumber
  }

  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    const arrangement = super._getSchematicPortArrangement()
    if (arrangement && Object.keys(arrangement).length > 0) return arrangement

    const props = this._getConnectorProps()
    if (isJstConnectorStandard(props.standard)) {
      return {
        leftSize: 0,
        rightSize: props.pinCount ?? 0,
      }
    }

    if (props.standard !== "usb_c") return arrangement

    const labelToPinNumber = this._getUsbCCanonicalLabelToPinNumberMap()
    const rightPins = USB_C_SIGNAL_LABELS_IN_ORDER.map((label) =>
      labelToPinNumber.get(label),
    ).filter((pin): pin is number => typeof pin === "number")
    const bottomPins = USB_C_SHELL_LABELS_IN_ORDER.map((label) =>
      labelToPinNumber.get(label),
    ).filter((pin): pin is number => typeof pin === "number")

    if (rightPins.length === 0 && bottomPins.length === 0) return arrangement

    const canonicalArrangement: SchematicPortArrangement = {}
    if (rightPins.length > 0) {
      canonicalArrangement.rightSide = {
        pins: rightPins,
        direction: "top-to-bottom",
      }
    }
    if (bottomPins.length > 0) {
      canonicalArrangement.bottomSide = {
        pins: bottomPins,
        direction: "left-to-right",
      }
    }

    return canonicalArrangement
  }

  _computeSchematicBoxDimensions(): SchematicBoxDimensions | null {
    if (this._getConnectorProps().standard !== "usb_c") {
      return super._computeSchematicBoxDimensions()
    }
    if (this.getSchematicSymbol()) return null
    if (!this.config.shouldRenderAsSchematicBox) return null

    const { _parsedProps: props } = this
    const pinCount = this._getPrimaryPinCount()
    const pinSpacing = 0.2
    const pinLabelsFromPorts = this._getPinLabelsFromPorts()
    const allPinLabels: Record<string, string> = {
      ...pinLabelsFromPorts,
    }
    if (props.pinLabels) {
      for (const [k, v] of Object.entries(props.pinLabels)) {
        if (typeof v === "string") allPinLabels[k] = v
      }
    }

    const labelToPinNumber = this._getUsbCCanonicalLabelToPinNumberMap()
    const resolvedDefaultSchPinStyle: SchematicPinStyle = {}
    for (const [label, style] of USB_C_DEFAULT_SCH_PIN_STYLE_BY_LABEL) {
      const pinNumber = labelToPinNumber.get(label)
      if (typeof pinNumber !== "number") continue
      resolvedDefaultSchPinStyle[`pin${pinNumber}`] = style
    }

    const mergedSchPinStyle = {
      ...resolvedDefaultSchPinStyle,
      ...(props.schPinStyle ?? {}),
    }
    const schPortArrangement = this._getSchematicPortArrangement()

    return getAllDimensionsForSchematicBox({
      schWidth: props.schWidth,
      schHeight: props.schHeight,
      schPinSpacing: pinSpacing,
      numericSchPinStyle: getNumericSchPinStyle(
        mergedSchPinStyle,
        allPinLabels,
      ),
      pinCount,
      schPortArrangement: schPortArrangement ?? undefined,
      pinLabels: allPinLabels,
    })
  }

  get config() {
    return {
      componentName: "Connector",
      zodProps: connectorProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const props = this._getConnectorProps()
    const manufacturerPartNumber = props.manufacturerPartNumber ?? props.mfn

    const source_component = db.source_component.insert({
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
      standard: props.standard,
      pin_count: props.pinCount,
    } as SourceSimpleConnector)

    this.source_component_id = source_component.source_component_id!

    if (props.standard && !manufacturerPartNumber) {
      db.source_missing_manufacturer_part_number_warning.insert({
        source_component_id: this.source_component_id,
        standard: props.standard,
        subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
        warning_type: "source_missing_manufacturer_part_number_warning",
        message: `${this.getString()} has standard="${props.standard}" but no manufacturerPartNumber (mfn). Add mfn if you do not want the connector part to change in future.`,
      })
    }
  }

  private _isUsingStandardPartsEngineCircuitJsonFlow() {
    if (!this._shouldUseStandardPartsEngineCircuitJsonFlow()) return false
    const partsEngine = this.getInheritedProperty("partsEngine")
    return Boolean(partsEngine?.fetchPartCircuitJson)
  }

  doInitialFetchPartFootprint(): void {
    const props = this._getConnectorProps()
    const standard = props.standard

    if (!standard) return
    if (!this._shouldUseStandardPartsEngineCircuitJsonFlow()) return
    if (this._hasStartedFootprintUrlLoad) return
    const partsEngine = this.getInheritedProperty("partsEngine") as
      | PartsEngine
      | undefined
    if (partsEngine && !partsEngine.fetchPartCircuitJson) {
      this._handleStandardConnectorCircuitJsonFailure(
        standard,
        "partsEngine.fetchPartCircuitJson is not configured",
      )
      return
    }
    const fetchPartCircuitJson = partsEngine?.fetchPartCircuitJson
    if (!fetchPartCircuitJson) return

    this._hasStartedFootprintUrlLoad = true

    // source_component_id is not yet set (SourceRender runs later), but after
    // the first await in this async effect synchronous phases complete and
    // source_component_id will be available for db updates.
    const sourceComponentForQuery = {
      type: "source_component",
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      standard,
      pin_count: props.pinCount,
    }

    this._queueAsyncEffect("load-standard-connector-circuit-json", async () => {
      const { db } = this.root!
      try {
        const supplierPartNumbers = await this._getSupplierPartNumbers(
          partsEngine,
          sourceComponentForQuery,
          `standard:${standard}`,
        )

        if (this.source_component_id) {
          db.source_component.update(this.source_component_id, {
            supplier_part_numbers: supplierPartNumbers,
          })
        }

        const circuitJson = await this._fetchStandardConnectorCircuitJson(
          fetchPartCircuitJson,
          supplierPartNumbers,
          sourceComponentForQuery.manufacturer_part_number,
        )
        if (!circuitJson) {
          this._handleStandardConnectorCircuitJsonFailure(
            standard,
            "part circuit JSON was not found",
          )
          return
        }

        this._addConnectorFootprintFromCircuitJson(standard, circuitJson)
      } catch (error: any) {
        if (this.source_component_id) {
          db.source_component.update(this.source_component_id, {
            supplier_part_numbers: {},
          })
        }
        this._handleStandardConnectorCircuitJsonFailure(standard, error.message)
      }
    })
  }

  doInitialPartsEngineRender(): void {
    // For standard connectors, supplier part numbers are already resolved
    // during FetchPartFootprint via findPart + fetchPartCircuitJson
    if (this._isUsingStandardPartsEngineCircuitJsonFlow()) return
    super.doInitialPartsEngineRender()
  }

  updatePartsEngineRender(): void {
    if (this._isUsingStandardPartsEngineCircuitJsonFlow()) return
    super.updatePartsEngineRender()
  }

  doInitialSchematicComponentRender(): void {
    super.doInitialSchematicComponentRender()
    if (
      !this.root?.schematicDisabled &&
      this.schematic_component_id &&
      this._getConnectorProps().standard === "usb_c"
    ) {
      const usbcSymbol = symbols.usbc
      if (usbcSymbol) {
        insertInnerSymbolInSchematicBox(this, usbcSymbol)
      }
    }
  }

  doInitialPcbComponentSizeCalculation(): void {
    super.doInitialPcbComponentSizeCalculation()
    if (this.root?.pcbDisabled) return
    if (!this.pcb_component_id || !this.source_component_id) return

    const { db } = this.root!
    const inferredInsertionCenter = inferCableInsertionCenterForComponent({
      circuitJson: db.toArray(),
      pcbComponentId: this.pcb_component_id,
      sourceComponentId: this.source_component_id,
    })
    if (!inferredInsertionCenter) return

    db.pcb_component.update(this.pcb_component_id, {
      cable_insertion_center: {
        x: inferredInsertionCenter.x,
        y: inferredInsertionCenter.y,
      },
    })
  }
}
