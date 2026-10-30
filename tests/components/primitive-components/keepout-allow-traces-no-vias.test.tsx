import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter does not place vias inside a keepout with allowTraces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="20mm">
      <keepout
        shape="rect"
        pcbX={0}
        pcbY={0}
        width="8mm"
        height="6mm"
        layers={["top", "bottom"]}
        allowPlacements
        allowTraces
      />

      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />

      <resistor name="R1" resistance="1k" footprint="1206" pcbX={-9} pcbY={5} />
      <resistor name="R2" resistance="1k" footprint="1206" pcbX={9} pcbY={5} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="1206"
        pcbX={-9}
        pcbY={-5}
      />
      <resistor name="R4" resistance="1k" footprint="1206" pcbX={9} pcbY={-5} />

      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace from=".U1 > .pin2" to=".R2 > .pin1" />
      <trace from=".U1 > .pin3" to=".R3 > .pin1" />
      <trace from=".U1 > .pin4" to=".R4 > .pin1" />
      <trace from=".U1 > .pin5" to=".R1 > .pin2" />
      <trace from=".U1 > .pin6" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) =>
    element.type.endsWith("_error"),
  )
  expect(errors).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(6)

  const keepout = circuit.db.pcb_keepout.list()[0]!
  expect(keepout.shape).toBe("rect")
  if (keepout.shape === "rect") {
    const viasInsideKeepout = circuit.db.pcb_via
      .list()
      .filter(
        (via) =>
          Math.abs(via.x - keepout.center.x) <= keepout.width / 2 &&
          Math.abs(via.y - keepout.center.y) <= keepout.height / 2,
      )
    expect(viasInsideKeepout).toEqual([])
  }
})
