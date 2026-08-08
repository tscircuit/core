import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const breakoutPadding = 2

interface BreakoutPaddingResultExplanationProps {
  expectedWidth: number
  expectedHeight: number
  actualWidth: number
  actualHeight: number
}

const BreakoutPaddingResultExplanation = ({
  expectedWidth,
  expectedHeight,
  actualWidth,
  actualHeight,
}: BreakoutPaddingResultExplanationProps) => {
  const paddingWasApplied =
    Math.abs(actualWidth - expectedWidth) < 1e-6 &&
    Math.abs(actualHeight - expectedHeight) < 1e-6

  return (
    <>
      <pcbnotetext
        text="TEST: breakout padding expands pcb_group bounds around its children"
        pcbY={3}
        fontSize="0.3mm"
        anchorAlignment="center"
      />
      <pcbnotetext
        text={`${paddingWasApplied ? "SUCCEEDED" : "FAILED"}: expected ${expectedWidth.toFixed(2)} × ${expectedHeight.toFixed(2)} mm; got ${actualWidth.toFixed(2)} × ${actualHeight.toFixed(2)} mm`}
        pcbY={2.2}
        fontSize="0.3mm"
        anchorAlignment="center"
      />
    </>
  )
}

const BreakoutPaddingReproBoard = ({
  result,
}: {
  result?: BreakoutPaddingResultExplanationProps
}) => (
  <board width="12mm" height="8mm" routingDisabled>
    {result && <BreakoutPaddingResultExplanation {...result} />}
    <breakout name="B" padding={`${breakoutPadding}mm`}>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </breakout>
  </board>
)

test("breakout padding expands pcb_group bounds around child components", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<BreakoutPaddingReproBoard />)

  await circuit.renderUntilSettled()

  const group = circuit.db.pcb_group.getWhere({ name: "B" })!
  const resistorSource = circuit.db.source_component.getWhere({ name: "R1" })!
  const resistor = circuit.db.pcb_component.getWhere({
    source_component_id: resistorSource.source_component_id,
  })!
  const result = {
    expectedWidth: resistor.width + breakoutPadding * 2,
    expectedHeight: resistor.height + breakoutPadding * 2,
    actualWidth: group.width!,
    actualHeight: group.height!,
  }

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(<BreakoutPaddingReproBoard result={result} />)
  await snapshotCircuit.renderUntilSettled()

  await expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })

  expect(group.width).toBeCloseTo(result.expectedWidth)
  expect(group.height).toBeCloseTo(result.expectedHeight)
})
