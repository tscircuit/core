import { expect, mock, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import {
  addPortIdsToTracesAtJumperPads,
  getJumperPadInfos,
} from "lib/components/primitive-components/Group/add-port-ids-to-traces-at-jumper-pads"

test("a batch without autoplaced jumpers never scans PCB components or pads", () => {
  const db = cju([])
  db.source_component.insert({ name: "R1", ftype: "simple_resistor" })
  const pcbComponents = mock(db.pcb_component.list)
  const pads = mock(db.pcb_smtpad.list)
  const sources = mock(db.source_component.list)
  const batchDb = {
    ...db,
    source_component: { ...db.source_component, list: sources },
    pcb_component: { ...db.pcb_component, list: pcbComponents },
    pcb_smtpad: { ...db.pcb_smtpad, list: pads },
  }
  const padInfos = getJumperPadInfos(batchDb)
  for (let i = 0; i < 2000; i++) {
    const segments: Array<PcbTrace["route"]> = [
      [
        { route_type: "wire", x: 0, y: i, width: 0.1, layer: "top" },
        { route_type: "wire", x: 1, y: i, width: 0.1, layer: "top" },
      ],
    ]
    expect(addPortIdsToTracesAtJumperPads(segments, padInfos)).toBe(segments)
  }
  expect(sources).toHaveBeenCalledTimes(1)
  expect(pcbComponents).not.toHaveBeenCalled()
  expect(pads).not.toHaveBeenCalled()
})
