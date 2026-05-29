import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Fragment } from "react"

const xiaoBottomFootprint = (
  <footprint>
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

test("repro-120: footprint layer should be bottom when component layer is bottom", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      <chip
        name="U1"
        layer="bottom"
        footprint={xiaoBottomFootprint}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
