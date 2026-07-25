import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("non-positive physical dimensions are reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <hole name="H1" diameter="-2mm" pcbX={-5} pcbY={0} />
      <via
        name="V1"
        pcbX={5}
        pcbY={0}
        holeDiameter="-0.3mm"
        outerDiameter="0.6mm"
      />
      {/* A valid component in the same board must not be flagged. */}
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={5} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "pcb_placement_error") as any[]

  // A negative diameter used to be accepted silently: the element carried
  // `hole_diameter: -2` and no error was raised at all.
  expect(errors.length).toBe(2)

  const messages = errors.map((e) => e.message).join("\n")
  expect(messages).toContain("pcb_hole")
  expect(messages).toContain("hole_diameter=-2mm")
  expect(messages).toContain("pcb_via")
  expect(messages).toContain("must be greater than zero")
  // The valid resistor's pads must not appear.
  expect(messages).not.toContain("pcb_smtpad")
})

test("a zero-size board is reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="0mm" height="0mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "pcb_placement_error") as any[]

  expect(errors.some((e) => String(e.message).includes("pcb_board"))).toBe(true)
})

test("valid dimensions raise no placement errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <hole name="H1" diameter="2mm" pcbX={-8} pcbY={0} />
      <via
        name="V1"
        pcbX={8}
        pcbY={0}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter(
      (e: any) =>
        e.type === "pcb_placement_error" &&
        String(e.message).includes("greater than zero"),
    )

  expect(errors).toEqual([])
})
