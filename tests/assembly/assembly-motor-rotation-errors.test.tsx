import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mount alignment rejects missing directions, ambiguous anchors and conflicting orientation", () => {
  for (const [model, anchor, rotation, orientation, shaft, message] of [
    [
      "nema17_round",
      "rightedge",
      "ROUND.shaftflat",
      undefined,
      undefined,
      "has no shaftflat reference",
    ],
    [
      "nema17",
      "rightedge",
      "ROUND.missing",
      undefined,
      undefined,
      "has no missing reference",
    ],
    [
      "nema17",
      "rightedge",
      "OTHER.wireside",
      undefined,
      undefined,
      "must reference its mounted motor",
    ],
    [
      "nema17",
      "rightedge",
      "ROUND.backface",
      undefined,
      undefined,
      "direction in the mounting face",
    ],
    [
      "nema17",
      "MISSING",
      "ROUND.wireside",
      undefined,
      undefined,
      "matched 0 components",
    ],
    [
      "nema17",
      "J_USB",
      "ROUND.wireside",
      undefined,
      undefined,
      "on the mounting axis",
    ],
    [
      "nema17",
      "DUP",
      "ROUND.wireside",
      undefined,
      undefined,
      "matched 2 components",
    ],
    [
      "nema17",
      "rightedge",
      "ROUND.wireside",
      "top_layer_toward_mount_face",
      "z-",
      "conflicts with motor",
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor
          name="ROUND"
          model={model}
          shaftFacingDirection={shaft}
        />
        <board
          name="CONTROLLER"
          width={42}
          height={42}
          mountedTo="ROUND.backface"
          mountRotationAnchor={anchor}
          mountRotation={rotation}
          mountOrientation={orientation}
          routingDisabled
        >
          <chip
            name="J_USB"
            footprint="soic8"
            pcbX={0}
            pcbY={0}
            cadModel={null}
          />
          <chip name="DUP" footprint="soic8" pcbX={10} cadModel={null} />
          <chip name="DUP" footprint="soic8" pcbX={-10} cadModel={null} />
        </board>
      </assembly.device>,
    )
    expect(() => circuit.render()).toThrow(message)
  }
  for (const [wireConnection, suffix] of [
    ["none", "nowires"],
    ["stubs", "wirestubs"],
    ["jst-ph-6", "jstph6"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          wireConnection={wireConnection}
        />
        <board
          width={42}
          height={42}
          mountedTo="MOTOR.backface"
          mountRotation="MOTOR.shaftflat"
          routingDisabled
        />
      </assembly.device>,
    )
    circuit.render()
    expect(circuit.db.cad_component.list()[0]!.model_glb_url).toBe(
      `https://modelcdn.tscircuit.com/jscad_models/nema17_${suffix}.glb`,
    )
  }
})
