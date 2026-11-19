import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stickers reject a missing parent part, unknown or unsized surfaces, and an underspecified size", () => {
  for (const [content, message] of [
    [
      <assembly.sticker
        name="LOOSE"
        surfaceRef="topSurface"
        width={8}
        height={3}
      />,
      /Sticker "LOOSE" must be a child of assembly.part or assembly.printedpart/,
    ],
    [
      <assembly.printedpart
        name="LID"
        jscad={<jscad.cuboid size={[20, 20, 4]} />}
      >
        <assembly.sticker name="TAG" surfaceRef="lid" width={8} height={3} />
      </assembly.printedpart>,
      /Part "LID" has no surface "lid"/,
    ],
    [
      <assembly.part
        name="BRACKET"
        cadModel={{ jscad: { type: "cuboid", size: [24, 16, 2] } }}
      >
        <assembly.sticker
          name="TAG"
          surfaceRef="topSurface"
          width={8}
          height={3}
        />
      </assembly.part>,
      /"topSurface" needs the bounds of part "BRACKET"/,
    ],
    [
      <assembly.part
        name="BRACKET"
        cadModel={{ jscad: { type: "cuboid", size: [24, 16, 2] } }}
      >
        <assembly.referencesurface name="face" />
        <assembly.sticker
          name="TAG"
          surfaceRef="face"
          width={8}
          height={3}
          distanceFromSurfaceLeftEdge={2}
        />
      </assembly.part>,
      /Sticker "TAG" uses distanceFromSurfaceLeftEdge, but surface "face" has no known size/,
    ],
    [
      <assembly.printedpart
        name="LID"
        jscad={<jscad.cuboid size={[20, 20, 4]} />}
      >
        <assembly.sticker
          name="TAG"
          surfaceRef="topSurface"
          imageUrl="./label.svg"
          width={8}
        />
      </assembly.printedpart>,
      /Sticker "TAG" needs both width and height/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{content}</assembly.device>)
    expect(() => circuit.render()).toThrow(message)
  }
})
