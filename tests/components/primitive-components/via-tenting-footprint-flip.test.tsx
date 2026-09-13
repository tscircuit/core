import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { Via } from "lib/components/primitive-components/Via"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit via tenting flips with the footprint while board defaults stay on board faces", () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const footprint = new Footprint({})
      const vias = [
        new Via({ pcbX: -4 }),
        new Via({ pcbX: -2, tented: "top_tented" }),
        new PcbVia({ pcbX: 0 }),
        new PcbVia({ pcbX: 2, tented: "top_tented" }),
        new PcbVia({ pcbX: 4, tentedOnTop: false }),
      ]
      for (const via of vias) footprint.add(via)
      const chip = new Chip({ name: "U1", layer, pcbRotation: rotation })
      chip.add(footprint)
      const board = new Board({
        width: 20,
        height: 20,
        defaultViaTenting: "top_tented",
      })
      board.add(chip)
      circuit.add(board)
      circuit.render()
      const expected = [
        [true, false],
        layer === "top" ? [true, false] : [false, true],
        [true, false],
        layer === "top" ? [true, false] : [false, true],
        layer === "top" ? [false, false] : [true, false],
      ]
      expect(
        vias.map((via) => {
          const emitted = circuit.db.pcb_via.get(via.pcb_via_id!)!
          return [emitted.tented_on_top, emitted.tented_on_bottom]
        }),
      ).toEqual(expected)
      expect(vias[0]._parsedProps.tented).toBeUndefined()
      expect(vias[2]._parsedProps.tented).toBeUndefined()
    }
  }
})
