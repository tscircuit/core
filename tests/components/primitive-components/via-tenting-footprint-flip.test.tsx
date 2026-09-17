import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { Via } from "lib/components/primitive-components/Via"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit via sides flip with the footprint while board defaults stay on board faces", () => {
  const { circuit } = getTestFixture()
  const inherited = new Via({ pcbX: -3 })
  const explicit = new Via({ pcbX: -1, tented: "top_tented" })
  const pcbVia = new PcbVia({ pcbX: 1, tented: "top_tented" })
  const partialOverride = new PcbVia({ pcbX: 3, tentedOnBottom: false })
  const pcbTrace = new PcbTrace({
    route: [
      {
        route_type: "via",
        x: 0,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
        tented_on_top: true,
        tented_on_bottom: false,
      },
    ],
  })
  const footprint = new Footprint({})
  footprint.add(pcbTrace)
  footprint.add(inherited)
  footprint.add(explicit)
  footprint.add(pcbVia)
  footprint.add(partialOverride)
  const chip = new Chip({ name: "U1", layer: "bottom", pcbRotation: 90 })
  chip.add(footprint)
  const board = new Board({
    width: 12,
    height: 12,
    defaultViaTenting: "top_tented",
  })
  board.add(chip)
  circuit.add(board)
  circuit.render()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    default_via_tented_on_top: true,
    default_via_tented_on_bottom: false,
  })
  expect(circuit.db.pcb_via.get(inherited.pcb_via_id!)).toMatchObject({
    tented_on_top: undefined,
    tented_on_bottom: undefined,
  })
  expect(circuit.db.pcb_via.get(explicit.pcb_via_id!)).toMatchObject({
    tented_on_top: false,
    tented_on_bottom: true,
  })
  expect(circuit.db.pcb_via.get(pcbVia.pcb_via_id!)).toMatchObject({
    tented_on_top: false,
    tented_on_bottom: true,
  })
  expect(circuit.db.pcb_via.get(partialOverride.pcb_via_id!)).toMatchObject({
    tented_on_top: false,
    tented_on_bottom: undefined,
  })
  expect(circuit.db.pcb_trace.get(pcbTrace.pcb_trace_id!)?.route).toMatchObject(
    [
      {
        route_type: "via",
        from_layer: "bottom",
        to_layer: "top",
        tented_on_top: false,
        tented_on_bottom: true,
      },
    ],
  )
  expect(inherited._parsedProps.tented).toBeUndefined()
})
