import type { SchematicPort } from "circuit-json"
import type { PinLabelsProp } from "@tscircuit/props"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { getPinNumberFromPinLabelsKey } from "lib/utils/schematic/getPinNumberFromPinLabelsKey"
import type { Chip } from "../../normal-components/Chip"
import type { SchematicBox } from "./SchematicBox"

const getLocalPinLabels = (
  pinLabels: PinLabelsProp | undefined,
): Array<{
  localPinNumber: number
  displayPinLabel: string
  pinAliases: string[]
}> => {
  if (!pinLabels) return []

  return Object.entries(pinLabels).map(([localPinKey, pinLabel]) => {
    const localPinNumber = getPinNumberFromPinLabelsKey(localPinKey)
    if (localPinNumber === null) {
      throw new Error(
        `Invalid schematicbox pinLabels key "${localPinKey}". Expected pin<number>.`,
      )
    }

    const pinAliases = typeof pinLabel === "string" ? [pinLabel] : [...pinLabel]
    return {
      localPinNumber,
      displayPinLabel: pinAliases[0] ?? localPinKey,
      pinAliases,
    }
  })
}

export const SchematicBox_doInitialSchematicComponentRender = (
  schematicBox: SchematicBox,
): void => {
  if (schematicBox.root?.schematicDisabled) return

  const { db } = schematicBox.root!
  const props = schematicBox._parsedProps
  if (!props.chipRef) return

  const referencedChip = schematicBox
    .getSubcircuit()
    .selectOne(`.${props.chipRef}`) as Chip | null
  if (!referencedChip?.source_component_id) {
    throw new Error(
      `Could not resolve chipRef "${props.chipRef}" for ${schematicBox.getString()}`,
    )
  }

  const localPinLabels = getLocalPinLabels(props.pinLabels)
  const pinLabelsByLocalPinKey = Object.fromEntries(
    localPinLabels.map(({ localPinNumber, displayPinLabel }) => [
      `pin${localPinNumber}`,
      displayPinLabel,
    ]),
  )
  const sourcePorts = db.source_port.list({
    source_component_id: referencedChip.source_component_id,
  })
  const dimensions = getAllDimensionsForSchematicBox({
    schWidth: props.width,
    schHeight: props.height,
    schPinSpacing: 0.2,
    pinCount: localPinLabels.length,
    schPortArrangement: props.schPinArrangement,
    pinLabels: pinLabelsByLocalPinKey,
  })
  const center = schematicBox._getGlobalSchematicPositionBeforeLayout()
  const size = dimensions.getSize()
  const schematicSheetId = schematicBox._resolveSchematicSheetId()
  const portLabels = Object.fromEntries(
    localPinLabels.map(({ localPinNumber, displayPinLabel }) => [
      String(localPinNumber),
      displayPinLabel,
    ]),
  )

  const schematicComponent = db.schematic_component.insert({
    center,
    size,
    source_component_id: referencedChip.source_component_id,
    is_box_with_pins: true,
    port_arrangement: underscorifyPortArrangement(props.schPinArrangement),
    port_labels: portLabels,
    pin_spacing: 0.2,
    schematic_sheet_id: schematicSheetId,
  })
  schematicBox.schematic_component_id =
    schematicComponent.schematic_component_id

  for (const {
    localPinNumber,
    displayPinLabel,
    pinAliases,
  } of localPinLabels) {
    const referencedSourcePort = sourcePorts.find((sourcePort) =>
      pinAliases.some(
        (pinAlias) =>
          sourcePort.name === pinAlias ||
          sourcePort.port_hints?.includes(pinAlias),
      ),
    )
    if (!referencedSourcePort) {
      throw new Error(
        `Could not find pin "${displayPinLabel}" on chipRef "${props.chipRef}"`,
      )
    }

    const localPortPosition =
      dimensions.getPortPositionByPinNumber(localPinNumber)
    if (!localPortPosition) {
      throw new Error(
        `Could not determine schematic position for ${schematicBox.getString()} pin${localPinNumber}`,
      )
    }

    const facingDirection = {
      left: "left",
      right: "right",
      top: "up",
      bottom: "down",
    }[localPortPosition.side] as SchematicPort["facing_direction"]

    db.schematic_port.insert({
      schematic_component_id: schematicComponent.schematic_component_id,
      center: {
        x: center.x + localPortPosition.x,
        y: center.y + localPortPosition.y,
      },
      source_port_id: referencedSourcePort.source_port_id,
      facing_direction: facingDirection,
      distance_from_component_edge: 0.4,
      side_of_component: localPortPosition.side,
      pin_number: localPinNumber,
      true_ccw_index: localPortPosition.trueIndex,
      display_pin_label: displayPinLabel,
      is_connected: false,
      schematic_sheet_id: schematicSheetId,
    })
  }

  const sectionName = props.name ?? props.chipRef
  db.schematic_text.insert({
    text: sectionName,
    schematic_component_id: schematicComponent.schematic_component_id,
    anchor: "left",
    rotation: 0,
    position: {
      x: center.x - size.width / 2,
      y: center.y + size.height / 2 + 0.13,
    },
    color: "#006464",
    font_size: 0.18,
    schematic_sheet_id: schematicSheetId,
  })
}
