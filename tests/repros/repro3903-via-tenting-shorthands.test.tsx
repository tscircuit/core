import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { Via } from "lib/components/primitive-components/Via"
import { getViaTenting } from "lib/utils/getViaTenting"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("getViaTenting, Board, Via, and PcbVia support boolean, shorthand, and asymmetric per-face tenting (#3903)", () => {
  expect(getViaTenting(undefined)).toEqual({})
  expect(getViaTenting(true)).toEqual({
    tented_on_top: true,
    tented_on_bottom: true,
  })
  expect(getViaTenting(false)).toEqual({
    tented_on_top: false,
    tented_on_bottom: false,
  })
  expect(getViaTenting("both")).toEqual({
    tented_on_top: true,
    tented_on_bottom: true,
  })
  expect(getViaTenting("top")).toEqual({
    tented_on_top: true,
    tented_on_bottom: false,
  })
  expect(getViaTenting("bottom")).toEqual({
    tented_on_top: false,
    tented_on_bottom: true,
  })
  expect(getViaTenting("none")).toEqual({
    tented_on_top: false,
    tented_on_bottom: false,
  })
  expect(getViaTenting({ top: true, bottom: false })).toEqual({
    tented_on_top: true,
    tented_on_bottom: false,
  })

  const { circuit } = getTestFixture()
  const board = new Board({
    width: "20mm",
    height: "10mm",
    viaTenting: "both",
  })
  board.add(
    new PcbVia({
      pcbX: -6,
      pcbY: 0,
      holeDiameter: "0.3mm",
      outerDiameter: "0.6mm",
      tented: "both",
    }),
  )
  board.add(
    new PcbVia({
      pcbX: -2,
      pcbY: 0,
      holeDiameter: "0.3mm",
      outerDiameter: "0.6mm",
      tented: { top: true, bottom: false },
    }),
  )
  board.add(
    new Via({
      pcbX: 2,
      pcbY: 0,
      holeDiameter: "0.3mm",
      outerDiameter: "0.6mm",
      fromLayer: "top",
      toLayer: "bottom",
      tented: { top: false, bottom: true },
    }),
  )
  board.add(
    new PcbVia({
      pcbX: 6,
      pcbY: 0,
      holeDiameter: "0.3mm",
      outerDiameter: "0.6mm",
      tented: "none",
    }),
  )
  circuit.add(board)

  circuit.render()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    default_via_tented_on_top: true,
    default_via_tented_on_bottom: true,
  })

  expect(circuit.db.pcb_via.list()).toMatchObject([
    { x: -6, tented_on_top: true, tented_on_bottom: true },
    { x: -2, tented_on_top: true, tented_on_bottom: false },
    { x: 2, tented_on_top: false, tented_on_bottom: true },
    { x: 6, tented_on_top: false, tented_on_bottom: false },
  ])
})
