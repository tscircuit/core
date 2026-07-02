import { expect, test } from "bun:test"
import { Net } from "lib/components/primitive-components/Net"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { Group_shouldAllowDuplicateChildName } from "lib/components/primitive-components/Group/Group_shouldAllowDuplicateChildName"

const makeTrace = (connectivityKey: string | null) => {
  const trace = new Trace({
    name: "shared_trace_name",
    from: ".R1 > .pin1",
    to: "net.GND",
  })
  trace.subcircuit_connectivity_map_key = connectivityKey
  return trace
}

test("duplicate trace names are allowed only with the same connectivity key", () => {
  expect(
    Group_shouldAllowDuplicateChildName([
      makeTrace("parent_connectivity_net0"),
      makeTrace("parent_connectivity_net0"),
    ]),
  ).toBe(true)

  expect(
    Group_shouldAllowDuplicateChildName([
      makeTrace("parent_connectivity_net0"),
      makeTrace("parent_connectivity_net1"),
    ]),
  ).toBe(false)

  expect(
    Group_shouldAllowDuplicateChildName([
      makeTrace("parent_connectivity_net0"),
      makeTrace(null),
    ]),
  ).toBe(false)

  expect(
    Group_shouldAllowDuplicateChildName([
      makeTrace("parent_connectivity_net0"),
      new Net({ name: "shared_trace_name" }),
    ]),
  ).toBe(false)
})
