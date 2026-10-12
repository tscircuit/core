import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual path remains valid when incoming copper touches the via", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 3, y: 0 },
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "inner2",
          },
          { x: 3, y: 0 },
          { x: 5, y: 0 },
          {
            x: 5,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 5, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Valid: top trace enters a top-to-inner2 via"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.includes("error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()[0]!.layers).toEqual([
    "top",
    "inner1",
    "inner2",
  ])
})
