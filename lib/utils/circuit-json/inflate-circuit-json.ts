import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson } from "circuit-json"
import type { Group } from "../../components/primitive-components/Group/Group"
import type {
  InflatorContext,
  SourceGroupId,
} from "../../components/primitive-components/Group/Subcircuit/InflatorFn"
import type { SubcircuitI } from "../../components/primitive-components/Group/Subcircuit/SubcircuitI"
import { inflatePcbBoard } from "../../components/primitive-components/Group/Subcircuit/inflators/inflatePcbBoard"
import { inflateSourceCapacitor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceCapacitor"
import { inflateSourceChip } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceChip"
import { inflateSourceDiode } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceDiode"
import { inflateSourceGroup } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceGroup"
import { inflateSourceInductor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceInductor"
import { inflateSourcePort } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourcePort"
import { inflateSourceResistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceResistor"
import { inflateSourceTrace } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTrace"
import { inflateSourceTransistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTransistor"

export const inflateCircuitJson = (
  target: SubcircuitI & Group<any>,
  circuitJson: CircuitJson | undefined,
  children: any[],
) => {
  if (!circuitJson) return
  const injectionDb = cju(circuitJson)

  if (circuitJson && children?.length > 0) {
    throw new Error("Component cannot have both circuitJson and children")
  }

  const groupsMap = new Map<SourceGroupId, Group<any>>()

  const inflationCtx: InflatorContext = {
    injectionDb,
    subcircuit: target,
    groupsMap,
  }

  // Sort source_groups so parents are processed before children
  // This is necessary because inflateSourceGroup needs the parent to exist
  // in groupsMap before adding children to it
  const sourceGroups = injectionDb.source_group.list()
  const sortedGroups = [...sourceGroups].sort((a, b) => {
    // Groups with no parent come first
    if (!a.parent_source_group_id && b.parent_source_group_id) return -1
    if (a.parent_source_group_id && !b.parent_source_group_id) return 1
    // Then sort by how "deep" they are (count parent chain length)
    const getDepth = (g: typeof a): number => {
      if (!g.parent_source_group_id) return 0
      const parent = sourceGroups.find(
        (sg) => sg.source_group_id === g.parent_source_group_id,
      )
      return parent ? 1 + getDepth(parent) : 0
    }
    return getDepth(a) - getDepth(b)
  })
  for (const sourceGroup of sortedGroups) {
    inflateSourceGroup(sourceGroup, inflationCtx)
  }

  const pcbBoards = injectionDb.pcb_board.list()
  for (const pcbBoard of pcbBoards) {
    inflatePcbBoard(pcbBoard, inflationCtx)
  }

  const sourceComponents = injectionDb.source_component.list()
  for (const sourceComponent of sourceComponents) {
    switch (sourceComponent.ftype) {
      case "simple_resistor":
        inflateSourceResistor(sourceComponent, inflationCtx)
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
      case "simple_chip":
        inflateSourceChip(sourceComponent, inflationCtx)
        break
      case "simple_transistor":
        inflateSourceTransistor(sourceComponent, inflationCtx)
        break
      default:
        throw new Error(
          `No inflator implemented for source component ftype: "${sourceComponent.ftype}"`,
        )
    }
  }

  const sourcePorts = injectionDb.source_port.list()
  for (const sourcePort of sourcePorts) {
    inflateSourcePort(sourcePort, inflationCtx)
  }

  const sourceTraces = injectionDb.source_trace.list()
  for (const sourceTrace of sourceTraces) {
    inflateSourceTrace(sourceTrace, inflationCtx)
  }
}
