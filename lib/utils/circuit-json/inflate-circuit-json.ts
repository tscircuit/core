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
import { inflateStandalonePcbPrimitives } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateStandalonePcbPrimitives"

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

  // Inflate source_groups in dependency order (parents before children)
  // Using explicit dependency tracking to detect cycles
  const sourceGroups = injectionDb.source_group.list()
  const renderedGroupIds = new Set<string>()
  const groupsToRender = [...sourceGroups]

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
    inflateSourceGroup(groupToRender, inflationCtx)
    renderedGroupIds.add(groupToRender.source_group_id)
    groupsToRender.splice(groupIndex, 1)
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

  // Inflate standalone PCB primitives (silkscreen, fab notes, pcb notes, etc.)
  // These are elements placed directly on the board without a component association
  inflateStandalonePcbPrimitives(inflationCtx)
}
