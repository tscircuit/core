import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson } from "circuit-json"
import type { Group } from "../../components/primitive-components/Group/Group"
import type { SubcircuitI } from "../../components/primitive-components/Group/Subcircuit/SubcircuitI"
import type {
  InflatorContext,
  SourceGroupId,
} from "../../components/primitive-components/Group/Subcircuit/InflatorFn"
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

  const sourceGroups = injectionDb.source_group.list()
  for (const sourceGroup of sourceGroups) {
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
