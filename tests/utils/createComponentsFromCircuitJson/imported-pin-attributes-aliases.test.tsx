import { expect, test } from "bun:test"
import type { SourcePort } from "circuit-json"
import { Chip } from "lib/components/normal-components/Chip"
import { Port } from "lib/components/primitive-components/Port"
import { resolvePortSourcePinAttributes } from "lib/components/primitive-components/Port/resolve-port-source-pin-attributes"

test("imported pin attributes resolve BGA aliases and reject ambiguous or unrelated contacts", () => {
  const chip = new Chip({ name: "U1" })
  const port = new Port({ name: "AVCC", pinNumber: 1, aliases: ["pinA1"] })
  chip.add(port)
  const sourcePort: SourcePort = {
    type: "source_port",
    source_port_id: "imported_A1",
    source_component_id: "imported_chip",
    name: "pinA1",
    port_hints: ["A1"],
    requires_voltage: 2.8,
    is_input: false,
  }
  chip._importedSourcePorts = [sourcePort]
  expect(resolvePortSourcePinAttributes(port)).toEqual({
    requires_voltage: 2.8,
    is_input: false,
  })
  chip._importedSourcePorts = [
    sourcePort,
    { ...sourcePort, source_port_id: "duplicate" },
  ]
  expect(resolvePortSourcePinAttributes(port)).toEqual({})
  chip._importedSourcePorts = [
    sourcePort,
    {
      ...sourcePort,
      source_component_id: "unrelated_chip",
      source_port_id: "unrelated",
    },
  ]
  expect(resolvePortSourcePinAttributes(port)).toEqual({})
  chip._importedSourcePorts = [
    { ...sourcePort, name: "pinA2", port_hints: ["A2"] },
  ]
  expect(resolvePortSourcePinAttributes(port)).toEqual({})
})
