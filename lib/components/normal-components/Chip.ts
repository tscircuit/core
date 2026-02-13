import { chipProps } from "@tscircuit/props"
import { pcb_component_invalid_layer_error } from "circuit-json"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { type SchematicBoxDimensions } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Port } from "lib/components/primitive-components/Port"
import type { z } from "zod"

export class Chip<PinLabels extends string = never> extends NormalComponent<
  typeof chipProps,
  PinLabels
> {
  schematicBoxDimensions: SchematicBoxDimensions | null = null

  constructor(props: z.input<typeof chipProps>) {
    super(props)
  }

  get config() {
    return {
      componentName: "Chip",
      zodProps: chipProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  initPorts(opts = {}): void {
    // First, call the parent initPorts to create ports normally
    super.initPorts(opts)

    // Then, ensure that any pins referenced in externallyConnectedPins have ports created
    const { _parsedProps: props } = this
    if (props.externallyConnectedPins) {
      const requiredPorts = new Set<string>()

      // Collect all pin identifiers that need ports
      for (const [pin1, pin2] of props.externallyConnectedPins) {
        requiredPorts.add(pin1)
        requiredPorts.add(pin2)
      }

      // Create ports for any missing pin identifiers
      for (const pinIdentifier of requiredPorts) {
        // Check if a port already exists that matches this identifier
        const existingPort = this.children.find(
          (child) =>
            child instanceof Port && child.isMatchingAnyOf([pinIdentifier]),
        )

        if (!existingPort) {
          // Try to parse as a numeric pin (e.g., "pin1" -> pinNumber: 1)
          const pinMatch = pinIdentifier.match(/^pin(\d+)$/)
          if (pinMatch) {
            const pinNumber = parseInt(pinMatch[1])
            this.add(
              new Port({
                pinNumber,
                aliases: [pinIdentifier],
              }),
            )
          } else {
            // It's an alias like "VCC", "VDD", etc.
            this.add(
              new Port({
                name: pinIdentifier,
                aliases: [pinIdentifier],
              }),
            )
          }
        }
      }
    }
  }

  doInitialSchematicComponentRender(): void {
    const { _parsedProps: props } = this
    // Early return if noSchematicRepresentation is true
    if (props?.noSchematicRepresentation === true) return

    // Continue with normal schematic rendering
    super.doInitialSchematicComponentRender()
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
    })

    this.source_component_id = source_component.source_component_id!
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()

    // Validate that components can only be placed on top or bottom layers
    const componentLayer = props.layer ?? "top"
    if (componentLayer !== "top" && componentLayer !== "bottom") {
      const subcircuit = this.getSubcircuit()
      const error = pcb_component_invalid_layer_error.parse({
        type: "pcb_component_invalid_layer_error",
        message: `Component cannot be placed on layer '${componentLayer}'. Components can only be placed on 'top' or 'bottom' layers.`,
        source_component_id: this.source_component_id!,
        layer: componentLayer,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      })
      db.pcb_component_invalid_layer_error.insert(error)
      // Still create the component but with 'top' as fallback to avoid cascading errors
    }

    const pcb_component = db.pcb_component.insert({
      center: { x: pcbX, y: pcbY },
      width: 2, // Default width, adjust as needed
      height: 3, // Default height, adjust as needed
      layer:
        componentLayer === "top" || componentLayer === "bottom"
          ? componentLayer
          : "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      do_not_place: props.doNotPlace ?? false,
      obstructs_within_bounds: props.obstructsWithinBounds ?? true,
      allow_off_board: props.allowOffBoard ?? false,
    })

    this.pcb_component_id = pcb_component.pcb_component_id
  }

  doInitialCreateTracesFromProps(): void {
    const { _parsedProps: props } = this

    if (props.externallyConnectedPins) {
      for (const [pin1, pin2] of props.externallyConnectedPins) {
        this.add(
          new Trace({
            from: `${this.getSubcircuitSelector()} > port.${pin1}`,
            to: `${this.getSubcircuitSelector()} > port.${pin2}`,
          }),
        )
      }
    }

    this._createTracesFromConnectionsProp()
  }

  doInitialSimulationRender() {
    const { db } = this.root!
    const { pinAttributes } = this.props as any

    if (!pinAttributes) return

    let powerPort: Port | null = null
    let groundPort: Port | null = null
    let voltage: number | undefined

    const ports = this.selectAll("port") as Port[]

    for (const port of ports) {
      for (const alias of port.getNameAndAliases()) {
        if (pinAttributes[alias]) {
          const attributes = pinAttributes[alias]
          if (attributes.providesPower) {
            powerPort = port
            voltage = attributes.providesVoltage
          }
          if (attributes.providesGround) {
            groundPort = port
          }
        }
      }
    }

    if (!powerPort || !groundPort || voltage === undefined) {
      return
    }

    const powerSourcePort = db.source_port.get(powerPort.source_port_id!)
    if (!powerSourcePort?.subcircuit_connectivity_map_key) return

    const groundSourcePort = db.source_port.get(groundPort.source_port_id!)
    if (!groundSourcePort?.subcircuit_connectivity_map_key) return

    const powerNet = db.source_net.getWhere({
      subcircuit_connectivity_map_key:
        powerSourcePort.subcircuit_connectivity_map_key,
    })
    const groundNet = db.source_net.getWhere({
      subcircuit_connectivity_map_key:
        groundSourcePort.subcircuit_connectivity_map_key,
    })

    if (!powerNet || !groundNet) {
      return
    }
    ;(db as any).simulation_voltage_source.insert({
      type: "simulation_voltage_source",
      positive_source_port_id: powerPort.source_port_id!,
      positive_source_net_id: powerNet.source_net_id,
      negative_source_port_id: groundPort.source_port_id!,
      negative_source_net_id: groundNet.source_net_id,
      voltage: voltage,
    })
  }
}
