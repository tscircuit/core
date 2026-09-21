import { expect, mock, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import {
  addPortIdsToTracesAtJumperPads,
  getJumperPadInfos,
} from "lib/components/primitive-components/Group/add-port-ids-to-traces-at-jumper-pads"

test("jumper discovery uses bulk reads and refreshes between routing batches", () => {
  const db = cju([])
  const emptyBatch = getJumperPadInfos(db)
  const source = db.source_component.insert({
    name: "__autoplaced_jumper_0",
    ftype: "simple_chip",
  })
  const component = db.pcb_component.insert({
    source_component_id: source.source_component_id,
    center: { x: 0, y: 0 },
    width: 1,
    height: 1,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  })
  db.pcb_smtpad.insert({
    pcb_component_id: component.pcb_component_id,
    pcb_port_id: "pcb_port_jumper",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    shape: "rect",
    layer: "top",
  })
  const sources = mock(db.source_component.list)
  const components = mock(db.pcb_component.list)
  const pads = mock(db.pcb_smtpad.list)
  const sourceGet = mock(db.source_component.get)
  const componentGet = mock(db.pcb_component.get)
  const batchDb = {
    ...db,
    source_component: { ...db.source_component, list: sources, get: sourceGet },
    pcb_component: { ...db.pcb_component, list: components, get: componentGet },
    pcb_smtpad: { ...db.pcb_smtpad, list: pads },
  }
  const padInfos = getJumperPadInfos(batchDb)
  for (let i = 0; i < 20; i++) {
    const route: PcbTrace["route"] = [-2, 0, 2].map((x) => ({
      route_type: "wire",
      x,
      y: 0,
      width: 0.1,
      layer: "top",
    }))
    const segments = addPortIdsToTracesAtJumperPads([route], padInfos)
    expect(segments).toHaveLength(2)
    expect(segments[0].at(-1)).toMatchObject({
      end_pcb_port_id: "pcb_port_jumper",
    })
    expect(segments[1][0]).toMatchObject({
      start_pcb_port_id: "pcb_port_jumper",
    })
  }
  expect(emptyBatch).toEqual([])
  expect(sources).toHaveBeenCalledTimes(1)
  expect(components).toHaveBeenCalledTimes(1)
  expect(pads).toHaveBeenCalledTimes(1)
  expect(sourceGet).not.toHaveBeenCalled()
  expect(componentGet).not.toHaveBeenCalled()
})
