import {
  cju,
  convertSchematicLengthUnits,
  getSchematicLengthUnitScale,
} from "@tscircuit/circuit-json-util"
import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
import type { CircuitJson } from "circuit-json"
import type { Group } from "../../components/primitive-components/Group/Group"
import type {
  InflatorContext,
  SourceGroupId,
} from "../../components/primitive-components/Group/Subcircuit/InflatorFn"
import type { SubcircuitI } from "../../components/primitive-components/Group/Subcircuit/SubcircuitI"
import { inflatePcbBoard } from "../../components/primitive-components/Group/Subcircuit/inflators/inflatePcbBoard"
import { inflateSimulation } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSimulation"
import { inflateSourceCapacitor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceCapacitor"
import { inflateSourceChip } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceChip"
import { inflateSourceConnector } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceConnector"
import { inflateSourceDiode } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceDiode"
import { inflateSourceFiducial } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceFiducial"
import { inflateSourceFuse } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceFuse"
import { inflateSourceGroup } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceGroup"
import { inflateSourceInductor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceInductor"
import { inflateSourceLed } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceLed"
import { inflateSourceMosfet } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceMosfet"
import { inflateSourcePort } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourcePort"
import { inflateSourcePushButton } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourcePushButton"
import { inflateSourceResistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceResistor"
import { inflateSourceSwitch } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceSwitch"
import { inflateSourceTestPoint } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTestPoint"
import { inflateSourceTrace } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTrace"
import { inflateSourceTransistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTransistor"
import { inflateStandalonePcbPrimitives } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateStandalonePcbPrimitives"

export const inflateCircuitJson = (target: SubcircuitI & Group<any>) => {
  const cachedJson = target._isolatedCircuitJson
  const circuitJson: CircuitJson | undefined =
    cachedJson ?? target._parsedProps.circuitJson
  if (!circuitJson) return

  target._isInflatedFromCircuitJson = true
  target._isolatedCircuitJson = null
  if (!cachedJson && target._parsedProps.children?.length > 0) {
    throw new Error("Component cannot have both circuitJson and children")
  }

  const injectionDb = cju(
    convertSchematicLengthUnits(circuitJson, LEGACY_SCHEMATIC_LENGTH_UNIT),
  )

  const groupsMap = new Map<SourceGroupId, Group<any>>()

  const context: InflatorContext = {
    injectionDb,
    subcircuit: target,
    fromIsolatedCache: !!cachedJson,
    groupsMap,
  }

  // Inflate source_groups in dependency order (parents before children)
  // Using explicit dependency tracking to detect cycles
  const renderedGroupIds = new Set<string>()
  const groupsToRender = [...injectionDb.source_group.list()]

  while (groupsToRender.length > 0) {
    // Find a group whose parent has already been rendered (or has no parent)
    const groupIndex = groupsToRender.findIndex(
      (g) =>
        !g.parent_source_group_id ||
        renderedGroupIds.has(g.parent_source_group_id),
    )

    if (groupIndex === -1) {
      const remainingIds = groupsToRender
        .map((g) => g.source_group_id)
        .join(", ")
      throw new Error(
        `Cannot inflate source_groups: cyclic dependency or missing parent detected. Remaining groups: ${remainingIds}`,
      )
    }

    const groupToRender = groupsToRender[groupIndex]
    inflateSourceGroup(groupToRender, context)
    renderedGroupIds.add(groupToRender.source_group_id)
    groupsToRender.splice(groupIndex, 1)
  }

  const pcbBoards = injectionDb.pcb_board.list()
  for (const pcbBoard of pcbBoards) {
    inflatePcbBoard(pcbBoard, context)
  }

  const sourceComponents = injectionDb.source_component.list()
  for (const sourceComponent of sourceComponents) {
    const group = groupsMap.get(sourceComponent.source_group_id ?? "") ?? target
    const scale = getSchematicLengthUnitScale(
      LEGACY_SCHEMATIC_LENGTH_UNIT,
      group._getSchematicLengthUnit(),
    )
    const center = injectionDb.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })?.center
    const inflationCtx = {
      ...context,
      schematicPlacement: center && {
        schX: center.x * scale,
        schY: center.y * scale,
      },
    }
    switch (sourceComponent.ftype) {
      case "simple_resistor":
        inflateSourceResistor(sourceComponent, inflationCtx)
        break
      case "simple_fuse":
        inflateSourceFuse(sourceComponent, inflationCtx)
        break
      case "simple_capacitor":
        inflateSourceCapacitor(sourceComponent, inflationCtx)
        break
      case "simple_inductor":
        inflateSourceInductor(sourceComponent, inflationCtx)
        break
      case "simple_diode":
        inflateSourceDiode(sourceComponent, inflationCtx)
        break
      case "simple_fiducial":
        inflateSourceFiducial(sourceComponent, inflationCtx)
        break
      case "simple_led":
        inflateSourceLed(sourceComponent, inflationCtx)
        break
      case "simple_chip":
        inflateSourceChip(sourceComponent, inflationCtx)
        break
      case "simple_connector":
        inflateSourceConnector(sourceComponent, inflationCtx)
        break
      case "simple_transistor":
        inflateSourceTransistor(sourceComponent, inflationCtx)
        break
      case "simple_mosfet":
        inflateSourceMosfet(sourceComponent, inflationCtx)
        break
      case "simple_push_button":
        inflateSourcePushButton(sourceComponent, inflationCtx)
        break
      case "simple_switch":
        inflateSourceSwitch(sourceComponent, inflationCtx)
        break
      case "simple_test_point":
        inflateSourceTestPoint(sourceComponent, inflationCtx)
        break
      default:
        throw new Error(
          `No inflator implemented for source component ftype: "${sourceComponent.ftype}"`,
        )
    }
  }

  const sourcePorts = injectionDb.source_port.list()
  for (const sourcePort of sourcePorts) {
    inflateSourcePort(sourcePort, context)
  }

  const sourceTraces = injectionDb.source_trace.list()
  for (const sourceTrace of sourceTraces) {
    inflateSourceTrace(sourceTrace, context)
  }

  // Inflate standalone PCB primitives (silkscreen, fab notes, pcb notes, etc.)
  // These are elements placed directly on the board without a component association
  inflateStandalonePcbPrimitives(context)
  inflateSimulation(context)
}
