import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { Am62lLpddr4FullBgaBoard } from "tests/fixtures/am62l-lpddr4-full-bga/full-bga-board"
import "tests/fixtures/extend-expect-any-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createPanelLabelSvg = (label: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="36"
  viewBox="0 0 800 36"
>
  <rect x="0" y="0" width="800" height="36" fill="#121212" />
  <text
    x="400"
    y="23"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="18"
    font-weight="700"
    text-anchor="middle"
  >${label}</text>
</svg>`

const createLabeledPanelSvg = (label: string, pcbSvg: string) =>
  stackSvgsVertically([createPanelLabelSvg(label), pcbSvg], {
    gap: 0,
    normalizeSize: false,
  })

const renderFullBoard = async (fanoutSolver: "normal" | "bga") => {
  const { circuit } = getTestFixture()
  circuit.add(<Am62lLpddr4FullBgaBoard fanoutSolver={fanoutSolver} />)
  await circuit.renderUntilSettled()
  return circuit
}

test("compares normal and BGA fanout on the full AM62L to LPDDR4 interface", async () => {
  const normalCircuit = await renderFullBoard("normal")
  const bgaCircuit = await renderFullBoard("bga")
  const comparisonSvg = stackSvgsHorizontally(
    [
      createLabeledPanelSvg(
        "Normal fanout solver",
        convertCircuitJsonToPcbSvg(normalCircuit.getCircuitJson()),
      ),
      createLabeledPanelSvg(
        "BGA fanout solver",
        convertCircuitJsonToPcbSvg(bgaCircuit.getCircuitJson()),
      ),
    ],
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": "am62l-lpddr4-normal-vs-bga-fanout",
      },
    },
  )

  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
}, 600_000)
