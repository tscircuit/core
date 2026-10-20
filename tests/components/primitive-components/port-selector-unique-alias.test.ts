import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Port } from "lib/components/primitive-components/Port"

test("port selectors preserve unique labels and skip shared aliases after tree changes", () => {
  const chip = new Chip({ name: "U1" })
  const firstGround = new Port({
    name: "GND",
    pinNumber: 1,
    aliases: ["COMMON", "RETURN"],
  })
  chip.add(firstGround)
  firstGround.physicalPinName = "A1"
  expect(firstGround.getPortSelector()).toBe(".U1 > port.GND")

  const secondGround = new Port({
    name: "GND",
    pinNumber: 2,
    aliases: ["COMMON"],
  })
  chip.add(secondGround)
  expect(secondGround.getPortSelector()).toBe(".U1 > port.pin2")
  expect(firstGround.getPortSelector()).toBe(".U1 > port.A1")
  expect(chip.selectAll("port.pin2")).toEqual([secondGround])

  const thirdGround = new Port({
    name: "GND",
    pinNumber: 3,
    aliases: ["COMMON", "A1"],
  })
  chip.add(thirdGround)
  expect(firstGround.getPortSelector()).toBe(".U1 > port.RETURN")
  expect(chip.selectAll("port.RETURN")).toEqual([firstGround])
  chip.remove(thirdGround)
  expect(firstGround.getPortSelector()).toBe(".U1 > port.A1")

  secondGround.externallyAddedAliases.push("A1")
  expect(firstGround.getPortSelector()).toBe(".U1 > port.RETURN")
})
