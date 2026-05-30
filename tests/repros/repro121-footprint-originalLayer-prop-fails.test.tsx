import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Fragment } from "react"

const xiaoBottomFootprint = (
  <footprint originalLayer="bottom">
    {Array.from({ length: 7 }, (_, i) => (
      <Fragment key={`xiao-left-${i + 1}`}>
        <smtpad
          portHints={[`pin${i + 1}`]}
          layer="bottom"
          shape="rect"
          pcbX="-7.55mm"
          pcbY={`${7.62 - i * 2.54}mm`}
          width="2.4mm"
          height="1.6mm"
        />
      </Fragment>
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <Fragment key={`xiao-right-${i + 8}`}>
        <smtpad
          portHints={[`pin${i + 8}`]}
          layer="bottom"
          shape="rect"
          pcbX="7.55mm"
          pcbY={`${-7.62 + i * 2.54}mm`}
          width="2.4mm"
          height="1.6mm"
        />
      </Fragment>
    ))}
  </footprint>
)

test("repro-121: footprint originalLayer prop should fail if not bottom", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      {/* No layer prop is passed */}
      <chip name="U1" footprint={xiaoBottomFootprint} pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
