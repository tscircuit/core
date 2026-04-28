import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import type { Group } from "./Group"
import type { Port } from "../Port/Port"
import type { SchematicComponent } from "circuit-json"

const parsePinNumberFromPortName = (
  name: string | undefined,
): number | null => {
  if (!name) return null
  const match = name.match(/^pin(\d+)$/i) ?? name.match(/^(\d+)$/)
  if (!match) return null
  const pinNumber = Number(match[1])
  return Number.isFinite(pinNumber) && pinNumber > 0 ? pinNumber : null
}

const getDirectGroupPorts = (group: Group<any>): Port[] => {
  return group.children.filter((child): child is Port => {
    return child.componentName === "Port"
  })
}

export const normalizeGroupSchematicBoxPorts = (group: Group<any>) => {
  const { db } = group.root!
  const ports = getDirectGroupPorts(group)

  for (const port of ports) {
    if (port._parsedProps.pinNumber !== undefined) continue
    const pinNumber = parsePinNumberFromPortName(port._parsedProps.name)
    if (pinNumber === null) continue
    port._parsedProps.pinNumber = pinNumber
  }

  const usedPinNumbers = new Set(
    ports
      .map((port) => port._parsedProps.pinNumber)
      .filter((pinNumber): pinNumber is number => pinNumber !== undefined),
  )
  let nextPinNumber = 1

  for (const port of ports) {
    if (port._parsedProps.pinNumber === undefined) {
      while (usedPinNumbers.has(nextPinNumber)) nextPinNumber++
      port._parsedProps.pinNumber = nextPinNumber
      usedPinNumbers.add(nextPinNumber)
    }

    if (port.source_port_id) {
      db.source_port.update(port.source_port_id, {
        pin_number: port._parsedProps.pinNumber,
        port_hints: port.getNameAndAliases(),
      })
    }
  }
}

export const getGroupSchematicBoxPinLabels = (
  group: Group<any>,
): Record<string, string> => {
  const pinLabels: Record<string, string> = {}
  for (const port of getDirectGroupPorts(group)) {
    const pinNumber = port._parsedProps.pinNumber
    const name = port._parsedProps.name
    if (pinNumber === undefined || !name) continue
    if (name === `pin${pinNumber}` || name === String(pinNumber)) continue
    pinLabels[`pin${pinNumber}`] = name
  }
  return pinLabels
}

export const Group_doInitialSchematicBoxComponentRender = (
  group: Group<any>,
) => {
  if (group.root?.schematicDisabled) return
  const { db } = group.root!
  const props = group._parsedProps

  normalizeGroupSchematicBoxPorts(group)

  const dimensions = group._getSchematicBoxDimensions()
  if (!dimensions) return

  const center = group._getGlobalSchematicPositionBeforeLayout()
  const size = dimensions.getSize()
  const portLabels = group._getPinLabelsFromPorts()
  const schPortArrangement = group._getSchematicPortArrangement()

  const schematicComponent = db.schematic_component.insert({
    center,
    size,
    source_group_id: group.source_group_id!,
    schematic_group_id: group.schematic_group_id ?? undefined,
    subcircuit_id:
      group.subcircuit_id ?? group.getSubcircuit()?.subcircuit_id ?? undefined,
    is_schematic_group: true,
    is_box_with_pins: true,
    port_arrangement: underscorifyPortArrangement(schPortArrangement!),
    pin_spacing: props.schPinSpacing ?? 0.2,
    pin_styles: underscorifyPinStyles(
      props.schPinStyle,
      portLabels,
    ) as SchematicComponent["pin_styles"],
    port_labels: portLabels,
  })

  group.schematic_component_id = schematicComponent.schematic_component_id

  if (group.schematic_group_id) {
    db.schematic_group.update(group.schematic_group_id, {
      center,
      width: size.width,
      height: size.height,
      schematic_component_ids: [schematicComponent.schematic_component_id],
    })
  }

  const title = props.schTitle ?? props.name
  if (title) {
    db.schematic_text.insert({
      text: title,
      schematic_component_id: schematicComponent.schematic_component_id,
      anchor: "left",
      rotation: 0,
      position: {
        x: center.x - size.width / 2,
        y: center.y + size.height / 2 + 0.13,
      },
      color: "#006464",
      font_size: 0.18,
    })
  }
}
