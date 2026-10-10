import { Fragment } from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  KeepoutTransformChip,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("rotated keepout bounds conservatively contain every transformed corner on both layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={48}
      height={29}
      schematicDisabled
      cadDisabled
      autorouter="none"
    >
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [45, -30, 135, 315].map((rotation, position) => (
          <Fragment key={`${layer}${rotation}`}>
            <KeepoutTransformChip
              name={`J${layer}${position}`}
              pcbX={-16 + position * 11}
              pcbY={7 - row * 13}
              pcbRotation={rotation}
              layer={layer}
            />
            <pcbnotetext
              text={`${layer} ${rotation}deg: conservative bbox`}
              pcbX={-16 + position * 11}
              pcbY={2 - row * 13}
              fontSize={0.55}
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const layer of ["top", "bottom"] as const)
    for (const position of [0, 1, 2, 3])
      expectKeepoutMatchesEmittedPads(circuit, `J${layer}${position}`, layer)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
