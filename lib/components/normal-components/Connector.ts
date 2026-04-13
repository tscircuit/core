import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point"
import {
  connectorProps,
  type ConnectorProps,
  type PartsEngine,
} from "@tscircuit/props"
import type { AnyCircuitElement, SourceSimpleConnector } from "circuit-json"
import { unknown_error_finding_part } from "circuit-json"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { convertCircuitJsonToUsbCStandardCircuitJson } from "lib/utils/connectors/convertCircuitJsonToUsbCStandardCircuitJson"
import { symbols } from "schematic-symbols"
import { Chip } from "./Chip"
import { insertInnerSymbolInSchematicBox } from "./Connector_insertInnerSymbolInSchematicBox"

export class Connector<
  PinLabels extends string = never,
> extends Chip<PinLabels> {
  private _getConnectorProps(): ConnectorProps {
    return this._parsedProps as ConnectorProps
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

  private _insertStandardConnectorCircuitJsonError(
    standard: string,
    message: string,
  ): void {
    const { db } = this.root!
    const errorObj = unknown_error_finding_part.parse({
      type: "unknown_error_finding_part",
      message: `Failed to fetch circuit JSON for ${this.getString()} (standard="${standard}"): ${message}`,
      source_component_id: this.source_component_id ?? undefined,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
    })
    db.unknown_error_finding_part.insert(errorObj)
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
    standard: string,
    circuitJson: AnyCircuitElement[],
  ): void {
    const props = this._getConnectorProps()
    const standardizedCircuitJson =
      standard === "usb_c"
        ? convertCircuitJsonToUsbCStandardCircuitJson(circuitJson)
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
    this.addAll(fpComponents)
    this._markDirty("InitializePortsFromChildren")
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

    const source_component = db.source_component.insert({
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
      standard: props.standard,
    } as SourceSimpleConnector)

    this.source_component_id = source_component.source_component_id!
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
      this._insertStandardConnectorCircuitJsonError(
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
        if (!circuitJson) return

        this._addConnectorFootprintFromCircuitJson(standard, circuitJson)
      } catch (error: any) {
        this._insertStandardConnectorCircuitJsonError(standard, error.message)
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
    const connectorCircuitJson = db.toArray().filter((elm: any) => {
      if (elm.type === "pcb_component") {
        return elm.pcb_component_id === this.pcb_component_id
      }
      if (elm.type === "source_component") {
        return elm.source_component_id === this.source_component_id
      }
      if (
        "pcb_component_id" in elm &&
        elm.pcb_component_id === this.pcb_component_id
      ) {
        return true
      }
      if (
        "source_component_id" in elm &&
        elm.source_component_id === this.source_component_id
      ) {
        return true
      }
      return false
    })

    if (connectorCircuitJson.length === 0) return

    const inferredInsertionCenter = guessCableInsertCenter(
      connectorCircuitJson as any,
    )

    db.pcb_component.update(this.pcb_component_id, {
      cable_insertion_center: {
        x: inferredInsertionCenter.x,
        y: inferredInsertionCenter.y,
      },
    })
  }
}
