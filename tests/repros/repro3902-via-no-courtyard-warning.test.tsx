import { expect, test } from "bun:test"
import { checkPcbComponentsMissingCourtyard } from "@tscircuit/checks"
import { Circuit } from "lib"
import React from "react"

test("repro #3902: standalone via does not emit pseudo pcb_component or trigger courtyard warning", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10} layers={2} routingDisabled>
      <net name="GND" />
      <chip
        name="J1"
        pcbX={-2}
        pcbY={0}
        pinLabels={{ pin1: "GND" }}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              holeDiameter={0.8}
              outerDiameter={1.4}
              shape="circle"
              pcbX={0}
              pcbY={0}
            />
            <courtyardcircle radius={1} pcbX={0} pcbY={0} />
          </footprint>
        }
      />
      <via
        name="VGND"
        pcbX={0}
        pcbY={0}
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.GND"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbComponents = circuitJson.filter((el) => el.type === "pcb_component")
  expect(pcbComponents).toHaveLength(1)
  expect(
    pcbComponents.some((c: any) =>
      c.source_component_id?.includes("source_manually_placed_via"),
    ),
  ).toBe(false)

  const pcbVias = circuitJson.filter((el) => el.type === "pcb_via")
  expect(pcbVias).toHaveLength(1)
  expect(pcbVias[0].outer_diameter).toBe(0.6)
  expect(pcbVias[0].hole_diameter).toBe(0.3)
  expect(pcbVias[0].x).toBe(0)
  expect(pcbVias[0].y).toBe(0)
  expect(pcbVias[0].pcb_port_ids).toHaveLength(2)

  const courtyardWarnings = checkPcbComponentsMissingCourtyard(circuitJson)
  expect(courtyardWarnings).toHaveLength(0)
})
