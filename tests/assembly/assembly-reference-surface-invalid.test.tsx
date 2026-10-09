import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reference surfaces reject invalid owners, duplicate names and tilted board mounts", async () => {
  const cases = [
    {
      element: (
        <assembly.device>
          <assembly.referencesurface name="bad" />
        </assembly.device>
      ),
      message: "must be a child",
    },
    {
      element: (
        <assembly.part name="PART">
          <assembly.referencesurface />
          <assembly.referencesurface />
        </assembly.part>
      ),
      message: "duplicate reference surface",
    },
    {
      element: (
        <assembly.printedpart
          name="PART"
          jscad={
            <>
              <jscad.cuboid size={[2, 2, 2]} />
              <jscad.rectangle name="top" size={[2, 2]} reference />
            </>
          }
        >
          <assembly.referencesurface name="top" />
        </assembly.printedpart>
      ),
      message: "duplicate reference surface",
    },
    {
      element: (
        <assembly.device>
          <assembly.part name="PART">
            <assembly.referencesurface name="side" plane="yz" />
          </assembly.part>
          <board width={10} height={10} mountedTo="PART.side" />
        </assembly.device>
      ),
      message: "tilted reference face",
    },
    {
      element: (
        <assembly.device>
          <assembly.part name="PART">
            <assembly.referencesurface name="top" />
          </assembly.part>
          <board width={10} height={10} mountedTo="PART.missing" />
        </assembly.device>
      ),
      message: "has no reference face",
    },
  ]
  for (const { element, message } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(element)
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
  }
})
