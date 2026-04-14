import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro109: repeated portHints on non-overlapping pads are ambiguous", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: "SIG",
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX="3mm"
              pcbY="0mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })
      ?.source_component_id,
  })
  const ambiguousRefs = circuit.db.source_ambiguous_port_reference.list()
  const pcbPorts = circuit.db.pcb_port.list()

  expect(sourcePorts).toHaveLength(1)
  expect(
    ambiguousRefs.map((error) => ({
      error_type: error.error_type,
      message: error.message.replaceAll(/#\d+/g, "#<id>"),
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "error_type": "source_ambiguous_port_reference",
        "message": "U1.SIG is ambiguous: U1.SIG references multiple non-overlapping pads: <smtpad#<id>(.pin1) />, <smtpad#<id>(.pin1) /> (consider using alternate aliases: pin1, 1)",
      },
    ]
  `)
  expect(pcbPorts).toHaveLength(0)
})
