import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MotorSpacer } from "./fixtures/motor-spacer"

test("printed-part mounts reject ambiguous faces, cycles, scope leaks, and overconstraint", () => {
  for (const [content, error] of [
    [
      <>
        <assembly.printedpart
          name="A"
          jscad={<MotorSpacer />}
          mountedTo="B.motor"
          mountFace="board"
        />
        <assembly.printedpart
          name="B"
          jscad={<MotorSpacer />}
          mountedTo="A.motor"
          mountFace="board"
        />
      </>,
      /mounting cycle.*A.*B.*A/,
    ],
    [
      <>
        <assembly.motor name="M" standard="nema17" />
        <assembly.printedpart
          name="S"
          jscad={<MotorSpacer />}
          mountedTo="M.backface"
          mountFace="missing"
        />
      </>,
      /no reference face "missing"/,
    ],
    [
      <>
        <assembly.printedpart name="S" jscad={<MotorSpacer />} />
        <board width={20} height={20} mountedTo="S.missing" />
      </>,
      /no reference face "missing"/,
    ],
    [
      <>
        <assembly.printedpart name="S" jscad={<MotorSpacer />} />
        <board name="B1" width={20} height={20} mountedTo="S.board" />
        <board name="B2" width={20} height={20} mountedTo="S.motor" />
      </>,
      /multiple mounted boards/,
    ],
    [
      <>
        <assembly.printedpart name="S" jscad={<MotorSpacer />} />
        <assembly.printedpart name="S" jscad={<MotorSpacer />} />
        <board width={20} height={20} mountedTo="S.board" />
      </>,
      /matched 2 assembly parts/,
    ],
    [
      <>
        <assembly.device>
          <assembly.motor name="M" standard="nema17" />
        </assembly.device>
        <assembly.printedpart
          name="S"
          jscad={<MotorSpacer />}
          mountedTo="M.backface"
          mountFace="motor"
        />
      </>,
      /matched 0 assembly parts/,
    ],
    [
      <>
        <assembly.printedpart
          name="S"
          jscad={
            <jscad.rotate angles={[0, Math.PI / 4, 0]}>
              <MotorSpacer />
            </jscad.rotate>
          }
        />
        <board width={20} height={20} mountedTo="S.board" />
      </>,
      /tilted reference face/,
    ],
    [
      <assembly.printedpart
        name="EMPTY"
        jscad={<jscad.rectangle name="face" reference size={[10, 10]} />}
      />,
      /needs solid geometry/,
    ],
    [
      <assembly.printedpart
        name="DUPLICATE"
        jscad={
          <>
            <MotorSpacer />
            <jscad.rectangle name="board" reference size={[10, 10]} />
          </>
        }
      />,
      /Duplicate reference plane/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{content}</assembly.device>)
    expect(() => circuit.render()).toThrow(error)
  }
})
