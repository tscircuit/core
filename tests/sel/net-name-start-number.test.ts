import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { test, expect } from "bun:test"

test("preprocessSelector - purely numeric net name throws, power-rail names pass", () => {
  expect(() => preprocessSelector("net.123")).toThrow(
    'Net name "123" cannot be purely numeric, add a letter, e.g. "VBUS1"',
  )

  for (const name of ["3V3", "5V", "12V", "3V3_SYS", "5V_BUCK", "1V"]) {
    expect(() => preprocessSelector(`net.${name}`)).not.toThrow()
  }
})
