import { shellProps } from "@tscircuit/props"
import type { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Group } from "./Group/Group"
import { Port } from "./Port"

const getPhysicalPortName = (physicalPinIdentifier: string): string =>
  physicalPinIdentifier.startsWith("pin")
    ? physicalPinIdentifier
    : `pin${physicalPinIdentifier}`

const isNormalComponent = (
  component: Group["children"][number],
): component is NormalComponent => component._isNormalComponent

/** A non-visual physical package namespace for independently placed units. */
export class Shell extends Group<typeof shellProps> {
  override _isShell = true

  override get config() {
    return {
      componentName: "Shell",
      zodProps: shellProps,
    }
  }

  override initPorts(): void {
    const units = this.children.filter(isNormalComponent)
    if (units.length === 0) return

    const mappedPhysicalPortNames = new Set<string>()
    const mappedUnitIds = new Set<string>()
    const mappedUnitNamesAndAliases = new Set<string>()

    for (const unit of units) {
      const unitId = unit._parsedProps.unitId
      const pinMapping: Record<string, string> =
        unit._parsedProps.pinMapping ?? {}
      if (!unitId) {
        throw new Error(
          `<${unit.lowercaseComponentName}> must define unitId when it is a direct child of <shell name="${this.name}">`,
        )
      }
      if (mappedUnitIds.has(unitId)) {
        throw new Error(
          `<shell name="${this.name}"> has duplicate unitId "${unitId}"`,
        )
      }
      mappedUnitIds.add(unitId)

      const conflictingUnitNameOrAlias = unit
        .getNameAndAliases()
        .find((unitNameOrAlias) =>
          mappedUnitNamesAndAliases.has(unitNameOrAlias),
        )
      if (conflictingUnitNameOrAlias) {
        throw new Error(
          `<shell name="${this.name}"> has duplicate unit refdes or alias "${conflictingUnitNameOrAlias}"`,
        )
      }
      for (const unitNameOrAlias of unit.getNameAndAliases()) {
        mappedUnitNamesAndAliases.add(unitNameOrAlias)
      }

      const mappedLogicalPorts = new Set<Port>()
      for (const [logicalTerminal, physicalPinIdentifier] of Object.entries(
        pinMapping,
      )) {
        const logicalPort = unit.children.find(
          (child): child is Port =>
            child instanceof Port && child.isMatchingAnyOf([logicalTerminal]),
        )
        if (!logicalPort) {
          throw new Error(
            `<${unit.lowercaseComponentName}> unitId="${unitId}" pinMapping references unknown terminal "${logicalTerminal}"`,
          )
        }
        if (mappedLogicalPorts.has(logicalPort)) {
          throw new Error(
            `<${unit.lowercaseComponentName}> unitId="${unitId}" maps terminal "${logicalTerminal}" more than once`,
          )
        }
        mappedLogicalPorts.add(logicalPort)

        const physicalPortName = getPhysicalPortName(physicalPinIdentifier)
        if (mappedPhysicalPortNames.has(physicalPortName)) {
          throw new Error(
            `<shell name="${this.name}"> maps physical pin "${physicalPinIdentifier}" more than once`,
          )
        }
        mappedPhysicalPortNames.add(physicalPortName)
        this.add(
          new Port({
            name: physicalPortName,
            aliases: [physicalPinIdentifier],
            connectsTo: `.${this.name}${unitId} > .${logicalTerminal}`,
          }),
        )
      }

      const unmappedLogicalPorts = unit.children.filter(
        (child): child is Port =>
          child instanceof Port &&
          child._isPrimaryPort &&
          !mappedLogicalPorts.has(child),
      )
      if (unmappedLogicalPorts.length > 0) {
        const unmappedTerminalNames = unmappedLogicalPorts.map(
          (port) =>
            port
              .getNameAndAliases()
              .find(
                (alias) => !/^pin\d+$/.test(alias) && !/^\d+$/.test(alias),
              ) ?? port.name,
        )
        throw new Error(
          `<${unit.lowercaseComponentName}> unitId="${unitId}" pinMapping is missing terminals: ${unmappedTerminalNames.join(", ")}`,
        )
      }
    }

    if (
      this._parsedProps.pinCount !== undefined &&
      mappedPhysicalPortNames.size !== this._parsedProps.pinCount
    ) {
      throw new Error(
        `<shell name="${this.name}"> pinCount is ${this._parsedProps.pinCount}, but pinMapping defines ${mappedPhysicalPortNames.size} physical pins`,
      )
    }
  }

  /** Returns physical pin identifiers mapped to their logical unit terminals. */
  pinMap(): Readonly<Record<string, string>> {
    const mappedPhysicalPinEntries: Array<readonly [string, string]> = []
    for (const unit of this.children.filter(isNormalComponent)) {
      const unitId = unit._parsedProps.unitId
      if (!unitId) continue
      const pinMapping: Record<string, string> =
        unit._parsedProps.pinMapping ?? {}
      for (const [logicalTerminal, physicalPinIdentifier] of Object.entries(
        pinMapping,
      )) {
        mappedPhysicalPinEntries.push([
          physicalPinIdentifier,
          `${this.name}${unitId}.${logicalTerminal}`,
        ])
      }
    }
    mappedPhysicalPinEntries.sort(([leftPhysicalPin], [rightPhysicalPin]) =>
      leftPhysicalPin.localeCompare(rightPhysicalPin, undefined, {
        numeric: true,
      }),
    )
    return Object.freeze(Object.fromEntries(mappedPhysicalPinEntries))
  }
}
