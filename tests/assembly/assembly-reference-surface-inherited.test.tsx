import { expect, test } from "bun:test"
import { createElement } from "react"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { executeJscadOperations } from "jscad-planner"
import modeling from "@jscad/modeling"

test("part-local reference offsets follow inherited PCB yaw and both layer frames", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const angle of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          {createElement(
            assembly.screen,
            { name: "SCREEN", connectsTo: ".U1", cadModel: "soic8" },
            <assembly.part name="BASE">
              <assembly.referencesurface xOffset={4} yOffset={5} zOffset={6} />
            </assembly.part>,
          )}
          <assembly.printedpart
            name="PROBE"
            mountedTo="BASE.anchor"
            mountFace="bottom"
            jscad={<jscad.cuboid size={[1, 1, 1]} center={[1, 2, 3]} />}
          >
            <assembly.referencesurface name="bottom" normalDirection="z-" />
          </assembly.printedpart>
          <board width={30} height={20} thickness={1.6} routingDisabled>
            <chip
              name="U1"
              footprint="soic8"
              pcbX={4}
              pcbY={-3}
              pcbRotation={angle}
              layer={layer}
            />
          </board>
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const source = circuit.db.source_component
        .list()
        .find((s) => s.name === "PROBE")!
      const cad = circuit.db.cad_component
        .list()
        .find((c) => c.source_component_id === source.source_component_id)!
      const center = modeling.measurements.measureCenter(
        executeJscadOperations(modeling as any, cad.model_jscad),
      )
      const theta = (angle * Math.PI) / 180
      const sign = layer === "bottom" ? -1 : 1
      const expected = [
        4 + Math.cos(theta) * sign * 5 - Math.sin(theta) * 7,
        -3 + Math.sin(theta) * sign * 5 + Math.cos(theta) * 7,
        sign * 9.8,
      ]
      for (const [axis, coordinate] of [
        cad.position.x,
        cad.position.y,
        cad.position.z,
      ].entries())
        expect(center[axis] + coordinate).toBeCloseTo(expected[axis], 5)
    }
  }
})
