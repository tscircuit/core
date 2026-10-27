import { expect, test } from "bun:test"
import type { BusProps } from "@tscircuit/props"
import type { Bus } from "lib/components/primitive-components/Bus"
import { getBusTargetLengthBounds } from "lib/utils/autorouting/getBusTargetLengthBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resolves independent bus bounds and intersects target windows", async () => {
  const cases: {
    props: Partial<BusProps>
    expected: { minLength?: number; maxLength?: number }
  }[] = [
    {
      props: { minLength: "19mm", maxLength: "20mm" },
      expected: { minLength: 19, maxLength: 20 },
    },
    { props: { minLength: 0 }, expected: { minLength: 0 } },
    {
      props: { maxLength: { reference: "longest_manhattan", offset: 2 } },
      expected: { maxLength: 22 },
    },
    {
      props: {
        minLength: {
          reference: "longest_manhattan",
          of: ["SHORT"],
          offset: -1,
        },
        maxLength: { reference: "longest_manhattan", of: ["LONG"] },
      },
      expected: { minLength: 11, maxLength: 20 },
    },
    {
      props: {
        targetLength: 20,
        lengthTolerance: 2,
        minLength: 19,
        maxLength: 21,
      },
      expected: { minLength: 19, maxLength: 21 },
    },
    {
      props: {
        targetLength: 20,
        lengthTolerance: 1,
        minLength: 18,
        maxLength: 22,
      },
      expected: { minLength: 19, maxLength: 21 },
    },
    {
      props: {
        minLength: {
          reference: "longest_manhattan",
          of: ["SHORT"],
          offset: -15,
        },
      },
      expected: { minLength: 0 },
    },
    { props: {}, expected: {} },
  ]
  for (const { props, expected } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={40} height={20} routingDisabled schematicDisabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-10}
          pcbY={3}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={10}
          pcbY={3}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-6}
          pcbY={-3}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={6}
          pcbY={-3}
        />
        <trace name="LONG" from="R1.pin1" to="R2.pin1" />
        <trace name="SHORT" from="R3.pin1" to="R4.pin1" />
        <bus name="DATA" connections={["LONG", "SHORT"]} {...props} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const bus = circuit.selectOne("bus") as Bus
    expect(getBusTargetLengthBounds(bus)).toEqual(expected)
    const minLength = bus._parsedProps.minLength
    if (typeof minLength === "object") {
      expect(circuit.db.source_bus.list()[0].min_length).toEqual({
        reference: "longest_manhattan",
        offset: minLength.offset,
        source_trace_ids: [
          circuit.db.source_trace.getWhere({ name: "SHORT" })!.source_trace_id,
        ],
      })
    }
  }
})
