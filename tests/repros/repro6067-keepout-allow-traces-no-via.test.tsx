import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro6067: autorouter does not place a via inside a keepout that has allowTraces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="16mm">
      <chip name="U1" footprint="soic8" pcbX={-9} pcbY={0} />
      <chip name="U2" footprint="soic8" pcbX={9} pcbY={0} pcbRotation={180} />
      <keepout
        shape="rect"
        width="8mm"
        height="6mm"
        pcbX={0}
        pcbY={0}
        layer="top"
        allowTraces
      />
      <trace from=".U1 > .pin1" to=".U2 > .pin5" />
      <trace from=".U1 > .pin2" to=".U2 > .pin6" />
      <trace from=".U1 > .pin3" to=".U2 > .pin7" />
      <trace from=".U1 > .pin4" to=".U2 > .pin8" />
      <trace from=".U1 > .pin8" to=".U2 > .pin1" />
      <trace from=".U1 > .pin7" to=".U2 > .pin2" />
      <trace from=".U1 > .pin6" to=".U2 > .pin3" />
      <trace from=".U1 > .pin5" to=".U2 > .pin4" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const keepout = circuit.db.pcb_keepout.list()[0]!
  expect(keepout).toBeDefined()
  expect(keepout.shape).toBe("rect")
  expect(keepout.allow_traces).toBe(true)

  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)

  if (keepout.shape === "rect") {
    const keepoutMinX = keepout.center.x - keepout.width / 2
    const keepoutMaxX = keepout.center.x + keepout.width / 2
    const keepoutMinY = keepout.center.y - keepout.height / 2
    const keepoutMaxY = keepout.center.y + keepout.height / 2

    const viasOverlappingKeepout = vias.filter((via) => {
      const viaRadius = via.outer_diameter / 2
      return (
        via.x + viaRadius >= keepoutMinX &&
        via.x - viaRadius <= keepoutMaxX &&
        via.y + viaRadius >= keepoutMinY &&
        via.y - viaRadius <= keepoutMaxY
      )
    })
    expect(viasOverlappingKeepout).toEqual([])
  }

  const errors = circuit
    .getCircuitJson()
    .filter(
      (el) =>
        el.type.endsWith("_error") || el.type === "pcb_keepout_overlap_warning",
    )
  expect(errors).toEqual([])
})
