import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { Port } from "lib/components/primitive-components/Port"

test("port selectors preserve valid names and resolve unusual names through existing aliases", () => {
  for (const name of ["GND", "3V3", "GPIO_1", "RESET-N", "µA"]) {
    const chip = new Chip({ name: "U1" })
    const port = new Port({ name, pinNumber: 1 })
    chip.add(port)
    expect(port.getPortSelector()).toBe(`.U1 > port.${name}`)
    expect(chip.selectAll(port.getPortSelector())).toEqual([port])
  }

  for (const name of [
    "ground.1",
    "USB+",
    "RESET#",
    "sense [A]",
    'pin"1',
    "A/B",
  ]) {
    const chip = new Chip({ name: "U1" })
    const port = new Port({ name, pinNumber: 1 })
    chip.add(port)
    expect(port.getPortSelector()).toBe(".U1 > port.pin1")
    expect(chip.selectAll(port.getPortSelector())).toEqual([port])
  }

  const chip = new Chip({ name: "J1" })
  const first = new Port({ name: "pin1", pinNumber: 1, aliases: ["pin2"] })
  const second = new Port({ name: "pin2", pinNumber: 2, aliases: ["pin1"] })
  chip.add(first)
  chip.add(second)
  expect(first.getPortSelector()).toBe('.J1 > port[name="pin1"]')
  expect(second.getPortSelector()).toBe('.J1 > port[name="pin2"]')
  expect(chip.selectAll(first.getPortSelector())).toEqual([first])
  expect(chip.selectAll(second.getPortSelector())).toEqual([second])
})
