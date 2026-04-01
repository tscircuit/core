import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point"
import { chipProps, type ConnectorProps } from "@tscircuit/props"
import type { AnyCircuitElement, SourceSimpleConnector } from "circuit-json"
import { unknown_error_finding_part } from "circuit-json"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { Chip } from "./Chip"

export class Connector<
  PinLabels extends string = never,
> extends Chip<PinLabels> {
  get config() {
    return {
      componentName: "Connector",
      zodProps: chipProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const connectorProps = this.props as ConnectorProps

    const source_component = db.source_component.insert({
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
      standard: connectorProps.standard,
    } as SourceSimpleConnector)

    this.source_component_id = source_component.source_component_id!
  }

  private _isUsingStandardPartsEngineCircuitJsonFlow() {
    const connectorProps = this.props as ConnectorProps
    if (!connectorProps.standard) return false
    if (this.getInheritedProperty("partsEngineDisabled")) return false
    const partsEngine = this.getInheritedProperty("partsEngine")
    return Boolean(partsEngine?.fetchPartCircuitJson)
  }

  doInitialPcbFootprintStringRender(): void {
    const { _parsedProps: props } = this
    const connectorProps = this.props as ConnectorProps
    const standard = connectorProps.standard

    if (standard) {
      if (this._hasStartedFootprintUrlLoad) return
      if (this.getInheritedProperty("partsEngineDisabled")) {
        super.doInitialPcbFootprintStringRender()
        return
      }
      const partsEngine = this.getInheritedProperty("partsEngine")
      if (!partsEngine?.fetchPartCircuitJson) {
        super.doInitialPcbFootprintStringRender()
        return
      }

      this._hasStartedFootprintUrlLoad = true

      // source_component_id is not yet set (SourceRender runs after PcbFootprintStringRender),
      // but after the first `await` in the async effect all synchronous render phases
      // including SourceRender will have run, making source_component_id available.
      const sourceComponentForQuery = {
        ftype: "simple_connector",
        name: this.name,
        manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
        standard,
      }

      this._queueAsyncEffect(
        "load-standard-connector-circuit-json",
        async () => {
          const { db } = this.root!
          try {
            // Step 1: findPart → supplier part numbers
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

            // Step 2: fetchPartCircuitJson with first available supplier part number
            let circuitJson: AnyCircuitElement[] | null = null
            for (const supplier of Object.keys(supplierPartNumbers ?? {})) {
              const nums = supplierPartNumbers[supplier]
              if (Array.isArray(nums) && nums.length > 0) {
                const maybeCircuitJson =
                  (await Promise.resolve(
                    partsEngine.fetchPartCircuitJson({
                      supplierPartNumber: nums[0],
                    }),
                  )) ?? null
                if (
                  Array.isArray(maybeCircuitJson) &&
                  maybeCircuitJson.length > 0
                ) {
                  circuitJson = maybeCircuitJson
                  break
                }
              }
            }

            // Fallback: manufacturer part number
            if (
              (!circuitJson || circuitJson.length === 0) &&
              sourceComponentForQuery.manufacturer_part_number
            ) {
              const maybeCircuitJson =
                (await Promise.resolve(
                  partsEngine.fetchPartCircuitJson({
                    manufacturerPartNumber:
                      sourceComponentForQuery.manufacturer_part_number,
                  }),
                )) ?? null
              if (
                Array.isArray(maybeCircuitJson) &&
                maybeCircuitJson.length > 0
              ) {
                circuitJson = maybeCircuitJson
              }
            }

            if (circuitJson && circuitJson.length > 0) {
              const fpComponents = createComponentsFromCircuitJson(
                {
                  componentName: this.name,
                  componentRotation: String(props.pcbRotation ?? 0),
                  footprinterString: `standard:${standard}`,
                  pinLabels: props.pinLabels,
                  pcbPinLabels: props.pcbPinLabels,
                },
                circuitJson,
              )
              this.addAll(fpComponents)
              this._markDirty("InitializePortsFromChildren")
            }
          } catch (error: any) {
            if (this.source_component_id) {
              db.source_component.update(this.source_component_id, {
                supplier_part_numbers: {},
              })
            }
            const errorObj = unknown_error_finding_part.parse({
              type: "unknown_error_finding_part",
              message: `Failed to fetch circuit JSON for ${this.getString()} (standard="${standard}"): ${error.message}`,
              source_component_id: this.source_component_id ?? undefined,
              subcircuit_id: this.getSubcircuit()?.subcircuit_id,
            })
            db.unknown_error_finding_part.insert(errorObj)
          }
        },
      )
      return
    }

    super.doInitialPcbFootprintStringRender()
  }

  doInitialPartsEngineRender(): void {
    // For standard connectors, supplier part numbers are already resolved
    // during PcbFootprintStringRender via findPart + fetchPartCircuitJson
    if (this._isUsingStandardPartsEngineCircuitJsonFlow()) return
    super.doInitialPartsEngineRender()
  }

  updatePartsEngineRender(): void {
    if (this._isUsingStandardPartsEngineCircuitJsonFlow()) return
    super.updatePartsEngineRender()
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
