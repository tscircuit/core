import { Fragment } from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  KeepoutTransformChip,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("imported keepouts follow top-layer pads at each right-angle rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={48}
      height={18}
      schematicDisabled
      cadDisabled
      autorouter="none"
    >
      {[0, 90, 180, 270].map((rotation, position) => (
        <Fragment key={rotation}>
          <KeepoutTransformChip
            name={`J${rotation}`}
            pcbX={-16 + position * 11}
            pcbRotation={rotation}
            layer="top"
          />
          <pcbnotetext
            text={`top ${rotation}deg: corners touch bounds`}
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
    expectKeepoutMatchesEmittedPads(circuit, `J${rotation}`, "top")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
