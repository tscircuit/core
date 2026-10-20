import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Port } from "lib/components/primitive-components/Port"

test("ports without a unique alias retain the legacy ambiguous selector", () => {
  const chip = new Chip({ name: "U1" })
  const firstGround = new Port({ name: "GND", aliases: ["A", "B"] })
  const secondGround = new Port({ name: "GND", aliases: ["B", "C"] })
  const thirdGround = new Port({ name: "GND", aliases: ["A", "C"] })
  chip.add(firstGround)
  chip.add(secondGround)
  chip.add(thirdGround)
  expect(firstGround.getPortSelector()).toBe(".U1 > port.GND")
  expect(secondGround.getPortSelector()).toBe(".U1 > port.GND")
  expect(chip.selectAll("port.GND")).toEqual([
    firstGround,
    secondGround,
    thirdGround,
  ])
})
