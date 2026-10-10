import { Fragment } from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  KeepoutTransformChip,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("imported keepouts mirror and follow bottom-layer pads at each right-angle rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={48} height={18} schematicDisabled autorouter="none">
      {[0, 90, 180, 270].map((rotation, position) => (
        <Fragment key={rotation}>
          <KeepoutTransformChip
            name={`J${rotation}`}
            pcbX={-16 + position * 11}
            pcbRotation={rotation}
            layer="bottom"
          />
          <pcbnotetext
            text={`bottom ${rotation}deg: corners touch bounds`}
            pcbX={-16 + position * 11}
            pcbY={-6}
            fontSize={0.55}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const rotation of [0, 90, 180, 270])
    expectKeepoutMatchesEmittedPads(circuit, `J${rotation}`, "bottom")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
