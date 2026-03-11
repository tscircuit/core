import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

export function setSubcircuitPcbComponentCalcVariables(params: {
  vars: Record<string, number>
  componentName: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}): void {
  const { vars, componentName, position, size } = params

  vars[`${componentName}.x`] = position.x
  vars[`${componentName}.y`] = position.y
  vars[`${componentName}.width`] = size.width
  vars[`${componentName}.height`] = size.height
  vars[`${componentName}.minX`] = position.x - size.width / 2
  vars[`${componentName}.maxX`] = position.x + size.width / 2
  vars[`${componentName}.minY`] = position.y - size.height / 2
  vars[`${componentName}.maxY`] = position.y + size.height / 2
}

export function getSubcircuitPcbCalcVariables(
  db: CircuitJsonUtilObjects,
): Record<string, number> {
  const vars: Record<string, number> = {}

  for (const sourceComponent of db.source_component.list()) {
    if (!sourceComponent.name) continue

    const pcbComponent = db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })
    if (!pcbComponent) continue

    setSubcircuitPcbComponentCalcVariables({
      vars,
      componentName: sourceComponent.name,
      position: {
        x: pcbComponent.center.x,
        y: pcbComponent.center.y,
      },
      size: {
        width: pcbComponent.width ?? 0,
        height: pcbComponent.height ?? 0,
      },
    })
  }

  return vars
}
