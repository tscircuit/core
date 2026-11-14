import { test, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectTypesMatch } from "tests/fixtures/expect-types-match"

const regulatorPinLabels = {
  pin1: "VIN",
  pin2: "GND",
  pin3: "VOUT",
} as const

const Regulator = (props: ChipProps<typeof regulatorPinLabels>) => (
  <chip {...props} footprint="sot23" pinLabels={regulatorPinLabels} />
)

test("sel types designators above 40 (U501, R535, C403)", () => {
  const selU501 = sel.U501(Regulator)
  expectTypesMatch<typeof selU501.VIN, string>(true)

  // @ts-expect-error pins are still checked against the chip's pin labels
  selU501.NOT_A_PIN

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <Regulator name="U501" />
      <resistor name="R535" resistance="10k" footprint="0402" schX={-4} />
      <capacitor name="C403" capacitance="1uF" footprint="0402" schX={4} />
      <trace from={sel.R535.pin2} to={selU501.VIN} />
      <trace from={selU501.VOUT} to={sel.C403.pos} />
      <trace from={sel.U501.GND} to={sel.net.GND} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
