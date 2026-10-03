import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("motor mounts reject missing, ambiguous, invalid-face and sideways targets", () => {
  for (const [mountedTo, motors, message] of [
    [
      "MISSING.backface",
      <assembly.motor name="MOTOR" standard="nema17" />,
      /matched 0 motors/,
    ],
    [
      "MOTOR.frontface",
      <assembly.motor name="MOTOR" standard="nema17" />,
      /must name a motor backface/,
    ],
    [
      "MOTOR",
      <assembly.motor name="MOTOR" standard="nema17" />,
      /must name a motor backface/,
    ],
    [
      "MOTOR.backface",
      <assembly.motor
        name="MOTOR"
        standard="nema17"
        shaftFacingDirection="x+"
      />,
      /rotated PCB boards are not yet supported/,
    ],
    [
      "MOTOR.backface",
      <>
        <assembly.motor name="MOTOR" standard="nema17" />
        <assembly.motor name="MOTOR" standard="nema23" />
      </>,
      /matched 2 motors/,
    ],
    [
      "MOTOR.backface",
      <assembly.subassembly name="MOTOR" model="nema17" />,
      /matched 0 motors/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        {motors}
        <board
          name="B1"
          width={42}
          height={42}
          mountedTo={mountedTo}
          routingDisabled
        />
      </assembly.device>,
    )
    expect(() => circuit.render()).toThrow(message)
  }
})
