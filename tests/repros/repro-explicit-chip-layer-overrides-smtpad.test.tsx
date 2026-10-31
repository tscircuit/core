import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit chip layer preserves the requested bottom SMT pad layer", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={6} routingDisabled>
      <chip
        name="TP1"
        pcbX={-3}
        pinLabels={{ pin1: "TEST" }}
        noConnect={["pin1"]}
        footprint={
          <footprint>
            <smtpad
              layer="bottom"
              shape="circle"
              radius={0.4}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <chip
        name="TP2"
        pcbX={3}
        layer="top"
        pinLabels={{ pin1: "TEST" }}
        noConnect={["pin1"]}
        footprint={
          <footprint>
            <smtpad
              layer="bottom"
              shape="circle"
              radius={0.4}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <pcbnotetext text="parent omitted" pcbX={-3} pcbY={1.6} fontSize={0.45} />
      <pcbnotetext text="parent top" pcbX={3} pcbY={1.6} fontSize={0.45} />
      <pcbnotetext
        text="both pads request bottom (blue)"
        pcbY={-1.6}
        fontSize={0.45}
      />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_smtpad.list().map((pad) => pad.layer)).toEqual([
    "bottom",
    "bottom",
  ])
  expect(circuit.db.pcb_port.list().map((port) => port.layers)).toEqual([
    ["bottom"],
    ["bottom"],
  ])
  expect(
    circuit.db.pcb_solder_paste.list().map((paste) => paste.layer),
  ).toEqual(["bottom", "bottom"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
