import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CSS mounts reject invalid, missing, ambiguous, cross-device and cyclic targets", () => {
  const base = (
    <assembly.part name="BASE">
      <assembly.referencesurface name="top" />
    </assembly.part>
  )
  for (const [content, message] of [
    [
      <>
        <assembly.part name="P" mountedTo="[" mountFace="base">
          <assembly.referencesurface name="base" />
        </assembly.part>
        {base}
      </>,
      /invalid mounting selector/,
    ],
    [
      <>
        <assembly.part name="P" mountedTo=".MISSING > .top" mountFace="base">
          <assembly.referencesurface name="base" />
        </assembly.part>
        {base}
      </>,
      /matched 0 reference faces/,
    ],
    [
      <>
        <assembly.part name="P" mountedTo=".BASE > .top" mountFace="base">
          <assembly.referencesurface name="base" />
        </assembly.part>
        {base}
        {base}
      </>,
      /matched 2 reference faces/,
    ],
    [
      <>
        <assembly.device name="OTHER">{base}</assembly.device>
        <assembly.part name="P" mountedTo=".BASE > .top" mountFace="base">
          <assembly.referencesurface name="base" />
        </assembly.part>
      </>,
      /matched 0 reference faces/,
    ],
    [
      <assembly.subassembly
        name="GROUP"
        mountedTo=".GROUP .top"
        mountFace="base"
      >
        <assembly.referencesurface name="base" />
        <assembly.part name="CHILD">
          <assembly.referencesurface name="top" />
        </assembly.part>
      </assembly.subassembly>,
      /mounting cycle/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{content}</assembly.device>)
    expect(() => circuit.render()).toThrow(message)
  }
})
