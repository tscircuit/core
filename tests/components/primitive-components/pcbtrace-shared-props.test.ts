import { pcbTraceProps as sharedPcbTraceProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  PcbTrace,
  pcbTraceProps,
  type PcbTraceProps,
} from "lib/components/primitive-components/PcbTrace"

test("pcbtrace uses shared props without a public source trace association", () => {
  const props = {
    route: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  }
  const trace = new PcbTrace(props)
  expect(pcbTraceProps).toBe(sharedPcbTraceProps)
  expect(trace.config.zodProps).toBe(sharedPcbTraceProps)
  expect("source_trace_id" in pcbTraceProps.shape).toBe(false)
  expect(
    pcbTraceProps.parse({ ...props, source_trace_id: "foreign_trace" }),
  ).not.toHaveProperty("source_trace_id")

  // Both the parsed type and constructor must keep Circuit JSON IDs out of props.
  const parsedProps: PcbTraceProps = pcbTraceProps.parse(props)
  // @ts-expect-error source_trace_id is internal state, not a parsed prop
  parsedProps.source_trace_id
  // @ts-expect-error source_trace_id is not a constructor prop
  new PcbTrace({ ...props, source_trace_id: "foreign_trace" })
})
