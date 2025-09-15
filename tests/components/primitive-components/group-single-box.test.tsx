import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/circuit"
import { render } from "@tscircuit/react"
import * as React from "react"

test("should render group as single box with external pins arranged", () => {
  const circuit = new Circuit()

  circuit.add(
    <group
      name="BoxGroup"
      showAsBox
      connections={{ D1: "Header1.pin1", D2: "Header2.pin1" }}
      schLayout={
        {
          /* layout details */
        }
      }
      schSpacing={0.25}
      schWidth={6}
      schHeight={4}
      schPins={{
        left: { pins: ["D1"], direction: "top-to-bottom" },
        right: { pins: ["D2"], direction: "bottom-to-top" },
      }}
    >
      <header name="Header1" pins={2} />
      <header name="Header2" pins={2} />
    </group>,
  )

  circuit.render()

  // Assert schematic box exists with expected dimensions
  const box = circuit.db.schematic_box.list().find((b) => b.name === "BoxGroup")
  expect(box).toBeDefined()
  expect(box.width).toBeCloseTo(6)
  expect(box.height).toBeCloseTo(4)

  // Assert schematic ports for external pins D1 and D2
  const ports = circuit.db.schematic_port
    .list()
    .filter((p) => ["D1", "D2"].includes(p.name))
  expect(ports.length).toBe(2)

  // Optionally assert positions and mapping to internal pins
})
