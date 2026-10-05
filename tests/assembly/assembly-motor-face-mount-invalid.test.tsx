import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Frame = () => (
  <assembly.printedpart
    name="FRAME"
    jscad={
      <>
        <jscad.cuboid size={[50, 50, 4]} center={[0, 0, -2]} />
        <jscad.rectangle name="motor" size={[50, 50]} reference />
      </>
    }
  />
)
const Motor = () => (
  <assembly.motor
    name="MOTOR"
    standard="nema17"
    mountedTo="FRAME.motor"
    mountFace="frontface"
  />
)

test("motor face mounts reject unresolved references, cycles, and board overconstraints", () => {
  for (const [content, error] of [
    [<Motor />, /matched 0 assembly parts/],
    [
      <>
        <Frame />
        <Frame />
        <Motor />
      </>,
      /matched 2 assembly parts/,
    ],
    [
      <>
        <Frame />
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          mountedTo="FRAME.missing"
          mountFace="frontface"
        />
      </>,
      /no reference face "missing"/,
    ],
    [
      <>
        <Frame />
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          mountedTo="FRAME.motor"
          mountFace="missing"
        />
      </>,
      /no mounting face "missing"/,
    ],
    [
      <>
        <assembly.motor
          name="A"
          standard="nema17"
          mountedTo="B.frontface"
          mountFace="backface"
        />
        <assembly.motor
          name="B"
          standard="nema17"
          mountedTo="A.backface"
          mountFace="frontface"
        />
      </>,
      /mounting cycle.*A.*B.*A/,
    ],
    [
      <>
        <assembly.printedpart
          name="FRAME"
          mountedTo="MOTOR.backface"
          mountFace="motor"
          jscad={
            <>
              <jscad.cuboid size={[10, 10, 4]} />
              <jscad.rectangle name="motor" size={[10, 10]} reference />
            </>
          }
        />
        <Motor />
      </>,
      /mounting cycle/,
    ],
    [
      <>
        <assembly.device>
          <Frame />
        </assembly.device>
        <Motor />
      </>,
      /matched 0 assembly parts/,
    ],
    [
      <>
        <Frame />
        <Motor />
        <board name="A" width={42} height={42} mountedTo="MOTOR.backface" />
        <board name="B" width={42} height={42} mountedTo="MOTOR.backface" />
      </>,
      /multiple mounted boards/,
    ],
    [
      <>
        <Frame />
        <Motor />
        <board
          name="CONTROL"
          width={42}
          height={42}
          mountedTo="MOTOR.backface"
          mountRotation="MOTOR.wireside"
        />
      </>,
      /mountRotation.*not supported in a face-mounted motor assembly/,
    ],
    [
      <>
        <Frame />
        <Motor />
        <board
          name="CONTROL"
          width={42}
          height={42}
          mountedTo="MOTOR.backface"
          mountOrientation="top_layer_toward_mount_face"
        />
      </>,
      /mountOrientation conflicts/,
    ],
    [
      <>
        <assembly.printedpart
          name="FRAME"
          jscad={
            <jscad.rotate angles={[0, Math.PI / 4, 0]}>
              <jscad.cuboid size={[50, 50, 4]} />
              <jscad.rectangle name="motor" size={[50, 50]} reference />
            </jscad.rotate>
          }
        />
        <Motor />
        <board
          name="CONTROL"
          width={42}
          height={42}
          mountedTo="MOTOR.backface"
        />
      </>,
      /tilted reference face/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{content}</assembly.device>)
    expect(() => circuit.render()).toThrow(error)
  }
})
