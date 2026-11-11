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
    expect(any_circuit_element.parse(record)).toEqual(record)
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
        ...connection.route.flatMap((point) => [
          point,
          ...(point.cubic_bezier_control_points ?? []),
        ]),
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
    // Check the emitted curves against actual block interiors, independently of
    // the generator's conservative trim-triangle clearance check.
    for (let index = 1; index < connection.route.length; index++) {
      const end = connection.route[index]
      if (!end.cubic_bezier_control_points) continue
      const start = connection.route[index - 1]
      const [a, b] = end.cubic_bezier_control_points
      for (let step = 0; step <= 20; step++) {
        const t = step / 20
        const s = 1 - t
        const point = {
          x:
            s ** 3 * start.x +
            3 * s * s * t * a.x +
            3 * s * t * t * b.x +
            t ** 3 * end.x,
          y:
            s ** 3 * start.y +
            3 * s * s * t * a.y +
            3 * s * t * t * b.y +
            t ** 3 * end.y,
        }
        expect(
          components.some(
            (block) =>
              block.system_block_page_id === connection.system_block_page_id &&
              Math.abs(point.x - block.center.x) < block.width / 2 - 1e-6 &&
              Math.abs(point.y - block.center.y) < block.height / 2 - 1e-6,
          ),
        ).toBe(false)
      }
    }

    for (let i = 1; i < connection.route.length; i++) {
      const a = connection.route[i - 1],
        b = connection.route[i]
      if (b.cubic_bezier_control_points) continue
      expect(a.x === b.x || a.y === b.y).toBe(true)
      // Check actual wire segments against block interiors, including endpoint
      // blocks; merely checking the vertices misses wires through a third block.
      for (const block of components.filter(
        (c) => c.system_block_page_id === connection.system_block_page_id,
      )) {
        const left = block.center.x - block.width / 2 + 1e-6
        const right = block.center.x + block.width / 2 - 1e-6
        const bottom = block.center.y - block.height / 2 + 1e-6
        const top = block.center.y + block.height / 2 - 1e-6
        const intersects =
          a.x === b.x
            ? a.x > left &&
              a.x < right &&
              Math.max(a.y, b.y) > bottom &&
              Math.min(a.y, b.y) < top
            : a.y > bottom &&
              a.y < top &&
              Math.max(a.x, b.x) > left &&
              Math.min(a.x, b.x) < right
        expect(intersects).toBe(false)
      }
    }
  }
}
