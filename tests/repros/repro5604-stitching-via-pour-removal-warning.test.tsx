import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when stitched pours have no path to a pad or explicitly placed via", async () => {
  const { circuit } = getTestFixture()
  let stitchedViasBeforeCleanup = 0
  circuit.on("board:renderPhaseStarted", ({ phase }) => {
    if (phase === "PcbCopperPourCleanup") {
      stitchedViasBeforeCleanup = Math.max(
        stitchedViasBeforeCleanup,
        circuit.db.pcb_via.list().length,
      )
    }
  })

  const outline = [
    { x: 1, y: -4 },
    { x: 9, y: -4 },
    { x: 9, y: 4 },
    { x: 1, y: 4 },
  ]
  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={4}
      enableViaStitching
      viaStitchPitch="2mm"
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-6}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" outline={outline} />
      <copperpour connectsTo="net.GND" layer="bottom" outline={outline} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  expect(stitchedViasBeforeCleanup).toBeGreaterThan(0)
  expect(json.filter((element) => element.type === "pcb_via")).toEqual([])
  expect(json.filter((element) => element.type === "pcb_copper_pour")).toEqual(
    [],
  )
  const warnings = json.filter(
    (element) => element.type === "pcb_copper_pour_isolated_warning",
  )
  expect(warnings).toHaveLength(2)
  expect(warnings).toContainEqual(
    expect.objectContaining({
      layer: "top",
      message:
        "Copper pour for GND on top was removed because its connected copper has no path to a same-net pad or an explicitly placed via. " +
        'Connect the pour to a same-net pad or an explicitly placed via, or use autorouter="fanout".',
    }),
  )
  expect(warnings).toContainEqual(expect.objectContaining({ layer: "bottom" }))
})
