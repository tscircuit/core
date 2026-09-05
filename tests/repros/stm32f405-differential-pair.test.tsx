import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Controller from "./stm32f405-differential-pair/index.circuit"

test("repro: STM32F405 USB differential pair with named nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Controller routingDisabled />)
  await circuit.renderUntilSettled()
  const board = circuit.firstChild
  if (!board) throw new Error("Expected the STM32F405 board")

  // Preserve the actual board placement before the routing-input conversion fails.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: board,
      fanoutPourNetMap: { inner1: "GND", inner2: "V3_3" },
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector ".U1 > .pin45" in differential pair "USB_FS"',
  )
})
