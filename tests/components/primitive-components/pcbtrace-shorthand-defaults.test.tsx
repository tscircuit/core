import type { PcbTraceProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "pcbtrace resolves defaults and point overrides without modifying its input",
  testPcbTraceDefaults,
)

async function testPcbTraceDefaults() {
  const { circuit } = getTestFixture()
  const cases = [
    {
      props: {
        route: [
          { x: -5, y: 5 },
          { x: 5, y: 5 },
        ],
      },
      width: 0.1,
      layer: "top",
      label: "DEFAULT: TOP / 0.1mm",
    },
    {
      props: {
        layer: "bottom",
        thickness: 0.2,
        route: [
          { x: -5, y: 0, trace_width: 0.6 },
          { x: 5, y: 0, trace_width: 0.6 },
        ],
      },
      width: 0.6,
      layer: "bottom",
      label: "OVERRIDE: BOTTOM / 0.6mm",
    },
    {
      props: {
        layer: "top",
        thickness: 0.2,
        route: [
          { route_type: "wire", x: -5, y: -5, width: 0.4, layer: "bottom" },
          { x: 5, y: -5, trace_width: 0.4 },
        ],
      },
      width: 0.4,
      layer: "bottom",
      label: "EXPLICIT: BOTTOM / 0.4mm",
    },
  ] satisfies Array<{
    props: PcbTraceProps
    width: number
    layer: "top" | "bottom"
    label: string
  }>

  for (const { props } of cases) {
    for (const point of props.route) Object.freeze(point)
    Object.freeze(props.route)
    Object.freeze(props)
  }
  circuit.add(
    <board width={22} height={20} routingDisabled>
      {cases.map(({ props, label }) => (
        <Fragment key={label}>
          <pcbtrace {...props} />
          <pcbnotetext
            text={label}
            pcbY={props.route[0].y + 1.5}
            fontSize={0.6}
            layer="top"
          />
        </Fragment>
      ))}
    </board>,
  )
  const board = circuit.children[0] as Board
  const traceCases = board
    .selectAll<PcbTrace>("pcbtrace")
    .map((trace, index) => {
      const parsedProps = structuredClone(trace._parsedProps)
      for (const point of trace._parsedProps.route) Object.freeze(point)
      Object.freeze(trace._parsedProps.route)
      Object.freeze(trace._parsedProps)
      Object.freeze(trace.props)
      return { ...cases[index]!, trace, parsedProps, size: trace.getPcbSize() }
    })
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })

  expect(traceCases).toHaveLength(cases.length)
  expect(circuit.db.pcb_trace.list()).toHaveLength(cases.length)
  for (const { trace, props, parsedProps, width, layer, size } of traceCases) {
    expect(size.width).toBeCloseTo(10 + width, 8)
    expect(size.height).toBeCloseTo(width, 8)
    const pcbTrace = circuit.db.pcb_trace.get(trace.pcb_trace_id!)!
    expect(pcbTrace.route).toEqual(
      props.route.map((point) => ({
        route_type: "wire",
        x: point.x,
        y: point.y,
        width,
        layer,
      })),
    )
    expect(trace._parsedProps).toEqual(parsedProps)
  }
}
