import { expect, test } from "bun:test"
import { normalizeDegrees } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, flipY, rotateDEG } from "transformation-matrix"

test("child cadmodel and object cadModel expose bottom offset composition", () => {
  for (const layer of ["bottom", "top"] as const) {
    for (const [
      pcbCcwRotationDegrees,
      modelCcwRotationOffsetZDegrees,
      expectedTopCcwRotationDegrees,
      expectedBottomCcwRotationDegrees,
      expectedBottomCadMatchesFootprint,
    ] of [
      [0, 0, 0, 0, true],
      [90, 0, 90, 270, true],
      [180, 0, 180, 180, true],
      [270, 0, 270, 90, true],
      [90, 30, 120, 240, false],
      [0, -45, 315, 45, false],
      [270, 450, 0, 0, false],
    ] as const) {
      const { circuit } = getTestFixture()
      const modelUrl = "https://example.com/model.step"
      // This model-local direction is deliberately asymmetric. The footprint
      // pad marks where the same feature lands after the model-local offset.
      // All coordinates are millimetres in right-handed local XY frames.
      const modelLocalWitnessDirection = { x: 0.73, y: -1.19 }
      const footprintLocalWitnessDirection = applyToPoint(
        rotateDEG(modelCcwRotationOffsetZDegrees),
        modelLocalWitnessDirection,
      )
      const rotationOffset = {
        x: 0,
        y: 0,
        z: modelCcwRotationOffsetZDegrees,
      }
      const createWitnessFootprint = () => (
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX={footprintLocalWitnessDirection.x}
            pcbY={footprintLocalWitnessDirection.y}
            width={0.2}
            height={0.2}
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX={-footprintLocalWitnessDirection.x}
            pcbY={-footprintLocalWitnessDirection.y}
            width={0.2}
            height={0.2}
            shape="rect"
          />
        </footprint>
      )
      circuit.add(
        <board width={20} height={20} routingDisabled>
          <resistor
            name="R_CHILD"
            resistance={1000}
            footprint={createWitnessFootprint()}
            pcbX={0}
            pcbY={0}
            layer={layer}
            pcbRotation={pcbCcwRotationDegrees}
            cadModel={
              <cadmodel modelUrl={modelUrl} rotationOffset={rotationOffset} />
            }
          />
          <resistor
            name="R_OBJECT"
            resistance={1000}
            footprint={createWitnessFootprint()}
            pcbX={0}
            pcbY={0}
            layer={layer}
            pcbRotation={pcbCcwRotationDegrees}
            cadModel={{ stepUrl: modelUrl, rotationOffset }}
          />
        </board>,
      )
      circuit.render()

      const cadComponents = circuit.db.cad_component.list()
      expect(cadComponents).toHaveLength(2)
      for (const cad of cadComponents) {
        const rotation = cad.rotation
        if (!rotation) throw new Error("CAD model did not emit a rotation")
        expect(rotation.x).toBeCloseTo(0, 5)
        expect(rotation.y).toBeCloseTo(layer === "bottom" ? 180 : 0, 5)
        const pcbComponent = circuit.db.pcb_component.getWhere({
          source_component_id: cad.source_component_id,
        })!
        const witnessPad = circuit.db.pcb_smtpad
          .list({ pcb_component_id: pcbComponent.pcb_component_id })
          .find((pad) => pad.port_hints?.includes("pin1"))!
        if (witnessPad.shape === "polygon") {
          throw new Error("Orientation witness must be a positioned SMT pad")
        }
        const emittedFootprintWitnessDirection = {
          x: witnessPad.x - pcbComponent.center.x,
          y: witnessPad.y - pcbComponent.center.y,
        }
        // Three.js applies Circuit JSON's XYZ Euler as Mx·Rz in board XY for
        // a bottom model (Y=180), matching core's actual footprint flipY().
        // This projects the model witness through the emitted CAD transform so
        // the expectation records whether it lands on the emitted PCB pad.
        const emittedCadWitnessDirection = applyToPoint(
          layer === "bottom"
            ? compose(flipY(), rotateDEG(rotation.z))
            : rotateDEG(rotation.z),
          modelLocalWitnessDirection,
        )
        const cadMatchesFootprint =
          Math.abs(
            emittedCadWitnessDirection.x - emittedFootprintWitnessDirection.x,
          ) < 1e-5 &&
          Math.abs(
            emittedCadWitnessDirection.y - emittedFootprintWitnessDirection.y,
          ) < 1e-5
        expect(cadMatchesFootprint).toBe(
          layer === "bottom" ? expectedBottomCadMatchesFootprint : true,
        )

        // Compare orientations, not whether equivalent angles use 0..360.
        expect(normalizeDegrees(rotation.z)).toBeCloseTo(
          layer === "bottom"
            ? expectedBottomCcwRotationDegrees
            : expectedTopCcwRotationDegrees,
          5,
        )
      }
    }
  }
})
