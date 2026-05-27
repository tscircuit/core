import {
  drcCheckProps,
  type CustomDrcCheckContext,
  type CustomDrcCheckInput,
  type CustomDrcConnectable,
  type SelectionResult,
  type SelectionResultComponent,
  type SelectionResultNet,
  type SelectionResultPort,
} from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPort,
  SourceComponentBase,
  SourceNet,
  SourcePort,
  SourceSimpleResistor,
} from "circuit-json"
import { any_circuit_element } from "circuit-json"
import type { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Net } from "./Net"
import { Port } from "./Port"

const isSelectionResultPort = (
  connectable: CustomDrcConnectable,
): connectable is SelectionResultPort => {
  if (!connectable || typeof connectable !== "object") return false
  const maybePort = connectable as Partial<SelectionResultPort>
  return typeof maybePort.getSourcePort === "function"
}

const isSelectionResultNet = (
  connectable: CustomDrcConnectable,
): connectable is SelectionResultNet => {
  if (!connectable || typeof connectable !== "object") return false
  const maybeNet = connectable as Partial<SelectionResultNet>
  return typeof maybeNet.getSourceNet === "function"
}

const isSelectionResultComponent = (
  connectable: CustomDrcConnectable,
): connectable is SelectionResultComponent => {
  if (!connectable || typeof connectable !== "object") return false
  const maybeComponent = connectable as Partial<SelectionResultComponent>
  return typeof maybeComponent.getPorts === "function"
}

const isCircuitJsonElement = (
  connectable: CustomDrcConnectable,
): connectable is AnyCircuitElement => {
  if (!connectable || typeof connectable !== "object") return false
  const maybeCircuitJsonElement = connectable as Partial<AnyCircuitElement>
  return typeof maybeCircuitJsonElement.type === "string"
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0

class SelectionResultPortImpl implements SelectionResultPort {
  constructor(private port: Port) {}

  getPcbPort(): PcbPort | null {
    const pcbPortId = this.port.pcb_port_id
    if (!pcbPortId) return null
    return this.port.root?.db.pcb_port.get(pcbPortId) ?? null
  }

  getSourcePort(): SourcePort | null {
    const sourcePortId = this.port.source_port_id
    if (!sourcePortId) return null
    return this.port.root?.db.source_port.get(sourcePortId) ?? null
  }
}

class SelectionResultNetImpl implements SelectionResultNet {
  constructor(private net: Net) {}

  getSourceNet(): SourceNet | null {
    const sourceNetId = this.net.source_net_id
    if (!sourceNetId) return null
    return this.net.root?.db.source_net.get(sourceNetId) ?? null
  }
}

class SelectionResultComponentImpl implements SelectionResultComponent {
  constructor(private component: PrimitiveComponent) {}

  getPort(name: string): SelectionResultPort | null {
    const port =
      this.component.selectOne<Port>(`port.${name}`, { type: "port" }) ??
      this.component.selectOne<Port>(`.${name}`, { type: "port" })
    if (!port) return null
    return new SelectionResultPortImpl(port)
  }

  getPorts(): SelectionResultPort[] {
    return this.component
      .selectAll<Port>("port")
      .map((port) => new SelectionResultPortImpl(port))
  }

  getPcbComponent(): PcbComponent | null {
    const pcbComponentId = this.component.pcb_component_id
    if (!pcbComponentId) return null
    return this.component.root?.db.pcb_component.get(pcbComponentId) ?? null
  }

  getSourceComponent(): SourceComponentBase | null {
    const sourceComponentId = this.component.source_component_id
    if (!sourceComponentId) return null
    return (
      (this.component.root?.db.source_component.get(sourceComponentId) as
        | SourceComponentBase
        | undefined) ?? null
    )
  }
}

export class DrcCheck extends PrimitiveComponent<typeof drcCheckProps> {
  get config() {
    return {
      componentName: "DrcCheck",
      zodProps: drcCheckProps,
    }
  }

  constructor(props: z.input<typeof drcCheckProps>) {
    super(props)
  }

  async runCustomDrcCheck(
    circuitJson: AnyCircuitElement[],
  ): Promise<AnyCircuitElement[]> {
    const result = await this._parsedProps.checkFn(
      this.createCustomDrcCheckContext(circuitJson),
    )
    let diagnostics: CustomDrcCheckInput[] = []
    if (Array.isArray(result)) {
      diagnostics = result
    } else if (result) {
      diagnostics = [result]
    }

    return diagnostics
      .map((diagnostic, index) =>
        this.createCircuitJsonDiagnostic(diagnostic, index),
      )
      .filter((diagnostic): diagnostic is AnyCircuitElement => !!diagnostic)
  }

  private createCustomDrcCheckContext(
    circuitJson: AnyCircuitElement[],
  ): CustomDrcCheckContext {
    return {
      select: this.selectCustomDrcElement.bind(
        this,
      ) as CustomDrcCheckContext["select"],
      selectAll: this.selectAllCustomDrcElements.bind(
        this,
      ) as CustomDrcCheckContext["selectAll"],
      isConnected: (a, b) => this.isConnected(a, b, circuitJson),
      isPulledUp: (a) =>
        this.isConnected(a, "net.VCC", circuitJson) ||
        this.isConnected(a, "net.VDD", circuitJson) ||
        this.getResistanceBetween(a, "net.VCC", circuitJson) !== null ||
        this.getResistanceBetween(a, "net.VDD", circuitJson) !== null,
      isPulledDown: (a) =>
        this.isConnected(a, "net.GND", circuitJson) ||
        this.getResistanceBetween(a, "net.GND", circuitJson) !== null,
      getResistanceBetween: (a, b) =>
        this.getResistanceBetween(a, b, circuitJson),
    }
  }

  private selectCustomDrcElement(selector: string): SelectionResult | null {
    return this.wrapSelectionResult(this.getSubcircuit().selectOne(selector))
  }

  private selectAllCustomDrcElements(selector: string): SelectionResult[] {
    const selectionResults: SelectionResult[] = []
    for (const component of this.getSubcircuit().selectAll(selector)) {
      const selectionResult = this.wrapSelectionResult(component)
      if (selectionResult) selectionResults.push(selectionResult)
    }
    return selectionResults
  }

  private wrapSelectionResult(
    component: PrimitiveComponent | null,
  ): SelectionResult | null {
    if (!component) return null
    if (component instanceof Port) return new SelectionResultPortImpl(component)
    if (component instanceof Net) return new SelectionResultNetImpl(component)
    return new SelectionResultComponentImpl(component)
  }

  private createCircuitJsonDiagnostic(
    diagnostic: CustomDrcCheckInput,
    index: number,
  ): AnyCircuitElement | null {
    const diagnosticRecord = diagnostic as Record<string, unknown>
    let diagnosticType = "source_component_misconfigured_error"
    if (typeof diagnosticRecord.error_type === "string") {
      diagnosticType = diagnosticRecord.error_type
    } else if (typeof diagnosticRecord.warning_type === "string") {
      diagnosticType = diagnosticRecord.warning_type
    }

    const diagnosticWithCircuitJsonDefaults: Record<string, unknown> = {
      ...diagnostic,
    }

    if (typeof diagnosticRecord.type === "string") {
      diagnosticWithCircuitJsonDefaults.type = diagnosticRecord.type
    } else {
      diagnosticWithCircuitJsonDefaults.type = diagnosticType
    }

    if (typeof diagnosticRecord.warning_type !== "string") {
      if (typeof diagnosticRecord.error_type === "string") {
        diagnosticWithCircuitJsonDefaults.error_type =
          diagnosticRecord.error_type
      } else {
        diagnosticWithCircuitJsonDefaults.error_type = diagnosticType
      }
    }

    const diagnosticIdField = `${diagnosticType}_id`
    if (diagnosticRecord[diagnosticIdField]) {
      diagnosticWithCircuitJsonDefaults[diagnosticIdField] =
        diagnosticRecord[diagnosticIdField]
    } else {
      diagnosticWithCircuitJsonDefaults[diagnosticIdField] =
        `${diagnosticType}_${this._renderId}_${index}`
    }

    return any_circuit_element.parse(diagnosticWithCircuitJsonDefaults)
  }

  private isConnected(
    a: CustomDrcConnectable,
    b: CustomDrcConnectable,
    circuitJson: AnyCircuitElement[],
  ): boolean {
    const aKeys = this.getConnectivityKeys(a, circuitJson)
    const bKeys = this.getConnectivityKeys(b, circuitJson)
    return aKeys.some((key) => bKeys.includes(key))
  }

  private getResistanceBetween(
    a: CustomDrcConnectable,
    b: CustomDrcConnectable,
    circuitJson: AnyCircuitElement[],
  ): number | null {
    if (this.isConnected(a, b, circuitJson)) return 0

    const aKeys = this.getConnectivityKeys(a, circuitJson)
    const bKeys = this.getConnectivityKeys(b, circuitJson)
    if (aKeys.length === 0 || bKeys.length === 0) return null

    const sourceResistors = circuitJson.filter(
      (elm): elm is SourceSimpleResistor =>
        elm.type === "source_component" && elm.ftype === "simple_resistor",
    )

    const root = this.root
    if (!root) return null

    for (const resistor of sourceResistors) {
      const resistorPorts = root.db.source_port.list({
        source_component_id: resistor.source_component_id,
      })
      if (resistorPorts.length !== 2) continue

      const resistorKeys = resistorPorts.map(
        (port) => port.subcircuit_connectivity_map_key,
      )
      const connectsA = resistorKeys.some((key) => key && aKeys.includes(key))
      const connectsB = resistorKeys.some((key) => key && bKeys.includes(key))

      if (connectsA && connectsB) return resistor.resistance
    }

    return null
  }

  private getConnectivityKeys(
    connectable: CustomDrcConnectable,
    circuitJson: AnyCircuitElement[],
  ): string[] {
    if (!connectable) return []

    if (typeof connectable === "string") {
      const selected = this.selectCustomDrcElement(connectable)
      if (selected) return this.getConnectivityKeys(selected, circuitJson)
      return []
    }

    if (isSelectionResultPort(connectable)) {
      return [
        connectable.getSourcePort()?.subcircuit_connectivity_map_key,
      ].filter(isNonEmptyString)
    }

    if (isSelectionResultNet(connectable)) {
      return [
        connectable.getSourceNet()?.subcircuit_connectivity_map_key,
      ].filter(isNonEmptyString)
    }

    if (isSelectionResultComponent(connectable)) {
      return connectable
        .getPorts()
        .flatMap((port) => this.getConnectivityKeys(port, circuitJson))
    }

    if (isCircuitJsonElement(connectable)) {
      return this.getCircuitJsonElementConnectivityKeys(
        connectable,
        circuitJson,
      )
    }

    return []
  }

  private getCircuitJsonElementConnectivityKeys(
    element: AnyCircuitElement | undefined,
    circuitJson: AnyCircuitElement[],
  ): string[] {
    if (!element) return []

    if (element.type === "source_port") {
      return [element.subcircuit_connectivity_map_key].filter(isNonEmptyString)
    }

    if (element.type === "source_net") {
      return [element.subcircuit_connectivity_map_key].filter(isNonEmptyString)
    }

    if (element.type === "pcb_port") {
      return this.getConnectivityKeys(element.source_port_id, circuitJson)
    }

    if (element.type === "source_component") {
      const root = this.root
      if (!root) return []

      return root.db.source_port
        .list({
          source_component_id: element.source_component_id,
        })
        .map((port) => port.subcircuit_connectivity_map_key)
        .filter(isNonEmptyString)
    }

    return []
  }
}
