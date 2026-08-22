import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createImportedPinLabels = (pinCount: number) =>
  Object.fromEntries(
    Array.from({ length: pinCount }, (_, index) => {
      const pinNumber = index + 1
      return [`pin${pinNumber}`, [`pin${pinNumber}`]]
    }),
  )

const createBoardPinLabels = (pinCount: number) =>
  Object.fromEntries(
    Array.from({ length: pinCount }, (_, index) => {
      const pinNumber = index + 1
      return [`pin${pinNumber}`, [`P${pinNumber}`, `pin${pinNumber}`]]
    }),
  )

const f1c200sPinLabels = {
  ...createImportedPinLabels(89),
  pin89: ["pin89", "thermalpad"],
}

const gd5f1gq5ueyigrPinLabels = {
  ...createImportedPinLabels(9),
  pin9: ["EP", "thermalpad"],
}

const F1C200S = (props: ChipProps) => (
  <chip
    pinLabels={f1c200sPinLabels}
    footprint="qfn88_thermalpad6.75mmx6.75mm_p0.4mm_h11mm_pw0.2mm_pl0.8mm_pin1location(bottomside,left)"
    {...props}
  />
)

const GD5F1GQ5UEYIGR = (props: ChipProps) => (
  <chip
    pinLabels={gd5f1gq5ueyigrPinLabels}
    footprint="dfn8_thermalpad3.4mmx4.3mm_w8.7998mm"
    {...props}
  />
)

test("MangoPi-style imported thermal pads overridden by board labels are diagnosed before autorouting", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="30mm"
      height="20mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <F1C200S name="U1" pcbX={-7} pinLabels={createBoardPinLabels(89)} />
      <GD5F1GQ5UEYIGR name="U3" pcbX={7} pinLabels={createBoardPinLabels(9)} />
      <trace from=".U1 > .pin89" to=".U3 > .pin9" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_port.list()).toHaveLength(98)
  expect(circuit.db.pcb_port.list()).toHaveLength(96)
  expect(
    circuit.db.pcb_port_not_matched_error
      .list()
      .map((error) => error.message)
      .sort(),
  ).toEqual([
    "Source port U1.P89 is connected but does not have a matching PCB port.",
    "Source port U3.P9 is connected but does not have a matching PCB port.",
  ])
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
})
