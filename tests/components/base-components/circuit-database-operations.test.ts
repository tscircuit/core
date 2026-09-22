import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("renderer database preserves root insertion, subtree and list-copy semantics", () => {
  const { db } = new RootCircuit()
  const component = db.source_component.insert({
    ftype: "simple_resistor",
    name: "R1",
    resistance: 1000,
    subcircuit_id: "sub1",
  })
  const inserted = db.insert({
    type: "source_port",
    source_port_id: "ignored",
    source_component_id: component.source_component_id,
    name: "1",
    pin_number: 1,
  })
  expect(db.toArray()).toContain(inserted)
  expect(
    db
      .subtree({ subcircuit_id: "sub1" })
      .source_component.get(component.source_component_id),
  ).toBe(component)
  const list = db.source_component.list()
  list.length = 0
  expect(db.source_component.list()).toEqual([component])
  db.source_component.update(component.source_component_id, { name: "R2" })
  expect(db.source_component.getWhere({ name: "R2" })).toBe(component)
  db.source_component.delete(component.source_component_id)
  expect(db.source_component.list()).toHaveLength(0)
})
