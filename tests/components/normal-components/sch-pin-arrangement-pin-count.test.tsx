import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const sidesOf = (ports: Array<{ side_of_component?: string }>) =>
  ports.reduce<Record<string, number>>((acc, port) => {
    const side = port.side_of_component ?? "unknown"
    acc[side] = (acc[side] ?? 0) + 1
    return acc
  }, {})

const renderWithArrangement = async (arrangement: unknown) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="30mm">
      <chip
        name="U1"
        footprint="soic8"
        schPinArrangement={arrangement as any}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.db.schematic_port.list()
}

test("schPinArrangement honours the PinCount spelling", async () => {
  const ports = await renderWithArrangement({
    leftPinCount: 4,
    rightPinCount: 4,
  })

  expect(ports.length).toBe(8)
  expect(sidesOf(ports)).toEqual({ left: 4, right: 4 })
})

test("PinCount and the deprecated Size spelling agree", async () => {
  // These are documented as equivalent — Size is marked "@deprecated, use
  // ...PinCount" in @tscircuit/props. Asserted by comparison so the two can't
  // drift apart again in either direction.
  const withPinCount = await renderWithArrangement({
    leftPinCount: 2,
    rightPinCount: 6,
  })
  const withSize = await renderWithArrangement({ leftSize: 2, rightSize: 6 })

  expect(withPinCount.length).toBe(withSize.length)
  expect(sidesOf(withPinCount)).toEqual(sidesOf(withSize))
  expect(sidesOf(withPinCount)).toEqual({ left: 2, right: 6 })
})

test("top and bottom PinCount place ports on all four sides", async () => {
  const ports = await renderWithArrangement({
    leftPinCount: 2,
    rightPinCount: 2,
    topPinCount: 2,
    bottomPinCount: 2,
  })

  expect(ports.length).toBe(8)
  expect(sidesOf(ports)).toEqual({ left: 2, right: 2, top: 2, bottom: 2 })
})

test("the deprecated Size spelling still works on its own", async () => {
  // The fix must not break the existing spelling.
  const ports = await renderWithArrangement({ leftSize: 4, rightSize: 4 })

  expect(ports.length).toBe(8)
  expect(sidesOf(ports)).toEqual({ left: 4, right: 4 })
})
