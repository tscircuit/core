import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTaperedWireGeometry } from "lib/utils/tapered-wire-geometry"

test("taper metadata and endpoints follow footprint pads through rotation and layer flips", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const board = new Board({ width: 25, height: 25, routingDisabled: true })
      const chip = new Chip({
        name: "U1",
        pcbX: 3,
        pcbY: 2,
        pcbRotation: rotation,
        layer,
      })
      const footprint = new Footprint({})
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: 0.1,
          height: 0.1,
          pcbX: 1,
          pcbY: 1,
          portHints: ["1"],
        }),
      )
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: 0.1,
          height: 0.1,
          pcbX: 4,
          pcbY: 2,
          portHints: ["2"],
        }),
      )
      const trace = new PcbTrace({
        route: [
          {
            route_type: "wire",
            x: 1,
            y: 1,
            layer: "top",
            width: 0.2,
            start_width: 0.2,
            end_width: 2,
            width_interpolation_mode: "quadratic",
          },
          { route_type: "wire", x: 4, y: 2, layer: "top", width: 0.2 },
        ],
      })
      footprint.add(trace)
      chip.add(footprint)
      board.add(chip)
      circuit.add(board)
      await circuit.renderUntilSettled()
      const emitted = circuit.db.pcb_trace.list()[0]!.route
      const pads = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.shape === "rect")
      expect(emitted[0]).toMatchObject({
        x: pads[0]!.x,
        y: pads[0]!.y,
        layer,
        start_width: 0.2,
        end_width: 2,
        width_interpolation_mode: "quadratic",
      })
      expect(emitted[1]).toMatchObject({ x: pads[1]!.x, y: pads[1]!.y, layer })
      const local = trace._parsedProps.route[0]!
      if (local.route_type !== "wire") throw new Error("Expected wire")
      const bounds = getTaperedWireGeometry(local, { x: 4, y: 2 }).bounds
      const size = trace.getPcbSize()
      expect(size.width).toBeGreaterThanOrEqual(bounds.right - bounds.left)
      expect(size.height).toBeGreaterThanOrEqual(bounds.top - bounds.bottom)
    }
  }
})
