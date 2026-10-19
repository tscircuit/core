import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { BSS123LT1G } from "tests/repros/assets/nema34-vbus-lv/bss123lt1g"

test("custom MOSFET schRotation reproduction with connected nets", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const rotations = [0, 90, 180, 270, -90, 450]

  circuit.add(
    <board>
      <group schX={2} schY={3}>
        {rotations.map((rotation, i) => (
          <Fragment key={rotation}>
            <net name={`GATE_${i + 1}`} isPowerNet={false} />
            <net name={`DRAIN_${i + 1}`} isPowerNet={false} />
            <net name={`SOURCE_${i + 1}`} isPowerNet={false} />
            <BSS123LT1G
              name={`Q${i + 1}`}
              schX={(i % 3) * 7}
              schY={-Math.floor(i / 3) * 7}
              schRotation={rotation}
              connections={{
                gate: `net.GATE_${i + 1}`,
                drain: `net.DRAIN_${i + 1}`,
                source: `net.SOURCE_${i + 1}`,
              }}
            />
            <schematictext
              schX={(i % 3) * 7}
              schY={-Math.floor(i / 3) * 7 - 3}
              text={`schRotation = ${rotation} deg`}
              fontSize={0.26}
            />
          </Fragment>
        ))}
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()

  // Reproduces #4697: every MOSFET stays gate-left, drain-up, source-down
  // despite the requested rotation. The fix PR updates this same snapshot.
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1600,
    height: 1000,
  })
})
