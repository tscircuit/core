import { expect, test } from "bun:test"
import { Board, SilkscreenOval, SilkscreenPill } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("oval and pill movement preserves dimensions/props and respects PCB disablement", async () => {
  const { circuit } = getTestFixture()
  const oval = new SilkscreenOval({
    radiusX: 3,
    radiusY: 1,
    pcbX: -4,
    pcbRotation: 30,
  })
  const pill = new SilkscreenPill({
    width: 6,
    height: 2,
    pcbX: 4,
    pcbRotation: -25,
  })
  const propsBefore = [
    structuredClone(oval._parsedProps),
    structuredClone(pill._parsedProps),
  ]
  const board = new Board({
    width: 22,
    height: 16,
    routingDisabled: true,
    schematicDisabled: true,
  })
  circuit.add(board)
  board.add(oval)
  board.add(pill)
  board.add(
    <pcbnotetext text="Both moved +2 mm X, +3 mm Y" pcbY={-5} fontSize={0.6} />,
  )
  await circuit.renderUntilSettled()
  oval._moveCircuitJsonElements({ deltaX: 2, deltaY: 3 })
  pill._moveCircuitJsonElements({ deltaX: 2, deltaY: 3 })
  expect(circuit.db.pcb_silkscreen_oval.list()[0]).toMatchObject({
    center: { x: -2, y: 3 },
    radius_x: 3,
    radius_y: 1,
  })
  expect(circuit.db.pcb_silkscreen_pill.list()[0]).toMatchObject({
    center: { x: 6, y: 3 },
    width: 6,
    height: 2,
  })
  expect([oval._parsedProps, pill._parsedProps]).toEqual(propsBefore)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { circuit: disabled } = getTestFixture({
    platform: { pcbDisabled: true },
  })
  disabled.add(
    <board>
      <silkscreenoval radiusX={3} radiusY={1} />
      <silkscreenpill width={6} height={2} />
    </board>,
  )
  await disabled.renderUntilSettled()
  expect(disabled.db.pcb_silkscreen_oval.list()).toHaveLength(0)
  expect(disabled.db.pcb_silkscreen_pill.list()).toHaveLength(0)

  for (const child of [
    new SilkscreenOval({ radiusX: 3, radiusY: 1, layer: "inner1" }),
    new SilkscreenPill({ width: 6, height: 2, layer: "inner1" }),
  ]) {
    const { circuit: invalid } = getTestFixture()
    const invalidBoard = new Board({ layers: 4 })
    invalid.add(invalidBoard)
    invalidBoard.add(child)
    expect(() => invalid.render()).toThrow('Must be "top" or "bottom"')
  }
})
