import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// `mfn` is a documented shorthand for `manufacturerPartNumber` on
// commonComponentProps, and most components honor it via
// `props.manufacturerPartNumber ?? props.mfn`. These four read
// `props.manufacturerPartNumber` only, so `mfn` silently parses and is dropped.

test("<chip /> mfn propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" mfn="ATTINY85-20SU" footprint="soic8" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "U1" })
      ?.manufacturer_part_number,
  ).toBe("ATTINY85-20SU")
})

test("<jumper /> mfn propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <jumper name="J1" mfn="61300211121" footprint="pinrow2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "J1" })
      ?.manufacturer_part_number,
  ).toBe("61300211121")
})

test("<solderjumper /> mfn propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <solderjumper name="SJ1" mfn="SJ-2A" footprint="solderjumper2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "SJ1" })
      ?.manufacturer_part_number,
  ).toBe("SJ-2A")
})

test("<pinout /> mfn propagation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <pinout name="PO1" mfn="PINOUT-1234" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "PO1" })
      ?.manufacturer_part_number,
  ).toBe("PINOUT-1234")
})

test("explicit manufacturerPartNumber still wins over mfn", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U2"
        manufacturerPartNumber="EXPLICIT-1"
        mfn="SHORTHAND-2"
        footprint="soic8"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component.getWhere({ name: "U2" })
      ?.manufacturer_part_number,
  ).toBe("EXPLICIT-1")
})
