import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const orientations = [
  "vertical",
  "horizontal",
  "pos_top",
  "pos_bottom",
  "pos_left",
  "pos_right",
  "neg_top",
  "neg_bottom",
  "neg_left",
  "neg_right",
] as const

test("resistor schOrientation", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="30mm" height="10mm">
      {orientations.map((o, i) => (
        <resistor
          key={o}
          name={`R_${o}`}
          resistance="1k"
          schOrientation={o}
          schX={(i % 5) * 3}
          schY={i < 5 ? 0 : 5}
          connections={{ pin1: "net.POS", pin2: "net.NEG" }}
        />
      ))}
    </board>,
  )

  project.render()

  const symbolNames = project.db.schematic_component
    .list()
    .map((c) => c.symbol_name)

  expect(symbolNames).toEqual([
    "boxresistor_down",
    "boxresistor_right",
    "boxresistor_down",
    "boxresistor_up",
    "boxresistor_right",
    "boxresistor_left",
    "boxresistor_up",
    "boxresistor_up",
    "boxresistor_left",
    "boxresistor_right",
  ])

  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
