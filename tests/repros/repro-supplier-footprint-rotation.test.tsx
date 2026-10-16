import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getMatching0603PartsEngine } from "tests/fixtures/get-matching-0603-parts-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("matching supplier footprints do not warn at 0 or 30 degrees", async () => {
  const partsEngine = await getMatching0603PartsEngine()
  const { circuit } = getTestFixture()
  const board = new Board({
    width: 60,
    height: 18,
    routingDisabled: true,
    partsEngine,
  })
  circuit.add(board)
  board.add(
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0603"
      pcbX={-8}
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
    />,
  )
  board.add(
    <capacitor
      name="C2"
      capacitance="100nF"
      footprint="0603"
      pcbX={8}
      pcbRotation={30}
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
    />,
  )
  board.add(
    <pcbnotetext
      text="Matching 0603 supplier footprints: neither should warn"
      pcbY={6}
      fontSize={0.7}
    />,
  )
  board.add(<pcbnotetext text="C1: 0 deg" pcbX={-8} pcbY={3} />)
  board.add(<pcbnotetext text="C2: 30 deg" pcbX={8} pcbY={3} />)
  await circuit.renderUntilSettled()

  const warnings = circuit.db.supplier_footprint_mismatch_warning.list()
  expect(warnings).toHaveLength(0)
  board.add(
    <pcbnotetext
      text={`Supplier footprint mismatch warnings: ${warnings.length}`}
      pcbY={-4}
      fontSize={0.65}
    />,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: false,
    width: 1500,
    height: 500,
  })
})
