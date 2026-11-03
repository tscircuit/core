import { expect } from "bun:test"
import {
  any_circuit_element,
  type AnyCircuitElement,
  type Point,
  type SystemBlockComponent,
} from "circuit-json"

/** Check emitted page-local mm geometry, independently of the layout algorithm. */
export function assertSystemGeometry(json: AnyCircuitElement[]) {
  const pages = json.filter((record) => record.type === "system_block_page")
  const blocks = json.filter(
    (record) =>
      record.type === "system_block_component" ||
      record.type === "system_block_group",
  )
  const connections = json.filter(
    (record) => record.type === "system_block_connection",
  )
  for (const record of [...pages, ...blocks, ...connections])
    any_circuit_element.parse(record)
  for (const page of pages) {
    for (const block of blocks.filter(
      (block) => block.system_block_page_id === page.system_block_page_id,
    )) {
      expect(Math.abs(block.center.x) + block.width / 2).toBeLessThanOrEqual(
        page.width / 2 + 1e-6,
      )
      expect(Math.abs(block.center.y) + block.height / 2).toBeLessThanOrEqual(
        page.height / 2 + 1e-6,
      )
    }
    for (const connection of connections.filter(
      (connection) =>
        connection.system_block_page_id === page.system_block_page_id,
    )) {
      for (const point of [
        ...connection.route,
        ...(connection.label_anchor_center
          ? [connection.label_anchor_center]
          : []),
      ]) {
        expect(Math.abs(point.x)).toBeLessThanOrEqual(page.width / 2 + 1e-6)
        expect(Math.abs(point.y)).toBeLessThanOrEqual(page.height / 2 + 1e-6)
      }
    }
  }
  const onBoundary = (point: Point, block: SystemBlockComponent) => {
    const dx = Math.abs(point.x - block.center.x)
    const dy = Math.abs(point.y - block.center.y)
    return (
      dx <= block.width / 2 + 1e-6 &&
      dy <= block.height / 2 + 1e-6 &&
      (Math.abs(dx - block.width / 2) < 1e-6 ||
        Math.abs(dy - block.height / 2) < 1e-6)
    )
  }
  const components = blocks.filter(
    (block) => block.type === "system_block_component",
  )
  for (const connection of connections) {
    const from = components.find(
      (block) =>
        block.system_block_component_id ===
        connection.from_system_block_component_id,
    )!
    const to = components.find(
      (block) =>
        block.system_block_component_id ===
        connection.to_system_block_component_id,
    )!
    expect(onBoundary(connection.route[0], from)).toBe(true)
    expect(onBoundary(connection.route.at(-1)!, to)).toBe(true)
  }
}
