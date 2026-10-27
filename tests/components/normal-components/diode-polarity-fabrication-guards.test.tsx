import { expect, test } from "bun:test"
import type { Diode } from "lib/components/normal-components/Diode"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode fallback preserves existing artwork and skips unknown or coincident terminals", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={64} height={24} routingDisabled>
      <diode name="D_AUTO" footprint="smdpads2_p3.4mm_pw1mm_ph1mm" pcbX={-24} />
      <diode
        name="D_NAMED"
        footprint="sod123w_cathodepin1"
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
        pcbX={-12}
      />
      <diode name="D_AUTHORED" pcbX={0}>
        <footprint>
          <smtpad
            shape="rect"
            width={1}
            height={1}
            pcbX={-1.5}
            portHints={["1", "anode"]}
          />
          <smtpad
            shape="rect"
            width={1}
            height={1}
            pcbX={1.5}
            portHints={["2", "cathode"]}
          />
          <fabricationnotetext text="+" pcbX={-1.5} fontSize={0.5} />
          <fabricationnotetext text="-" pcbX={1.5} fontSize={0.5} />
          <fabricationnotetext text="AUTHORED" pcbY={-2} fontSize={0.5} />
        </footprint>
      </diode>
      <diode
        name="D_UNKNOWN"
        footprint="smdpads2_p3.4mm_pw1mm_ph1mm"
        pinLabels={{ pin1: ["terminal1"], pin2: ["terminal2"] }}
        pcbX={12}
      />
      <diode
        name="D_COINCIDENT"
        pinLabels={{ pin1: ["anode"], pin2: ["cathode"] }}
        pcbX={24}
      >
        <footprint>
          <smtpad shape="rect" width={1} height={1} portHints={["1"]} />
          <smtpad shape="rect" width={1} height={1} portHints={["2"]} />
        </footprint>
      </diode>
      <diode
        name="D_INLINE"
        pcbY={-6}
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
      >
        <footprint>
          <smtpad
            shape="rect"
            width={1}
            height={1}
            pcbX={-1.5}
            portHints={["1"]}
          />
          <smtpad
            shape="rect"
            width={1}
            height={1}
            pcbX={1.5}
            portHints={["2"]}
          />
        </footprint>
      </diode>
      <diode
        name="D_CONFLICT"
        footprint="smdpads2_p3.4mm_pw1mm_ph1mm"
        pinLabels={{ pin1: ["anode", "cathode"], pin2: ["cathode"] }}
        pcbX={-12}
        pcbY={-6}
      />
      <diode
        name="D_NO_PADS"
        pinLabels={{ pin1: ["anode"], pin2: ["cathode"] }}
        pcbX={12}
        pcbY={-6}
      />
      <pcbnotetext
        text="AUTO/INLINE: add notes; NAMED/AUTHORED: preserve notes"
        pcbY={7}
        fontSize={0.6}
      />
      <pcbnotetext
        text="UNKNOWN/CONFLICT/COINCIDENT/NO_PADS: do not guess"
        pcbY={-10}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [name, expectedPaths, expectedLabels] of [
    ["D_AUTO", 4, 2],
    ["D_NAMED", 4, 2],
    ["D_AUTHORED", 0, 3],
    ["D_UNKNOWN", 0, 0],
    ["D_COINCIDENT", 0, 0],
    ["D_INLINE", 4, 2],
    ["D_CONFLICT", 0, 0],
    ["D_NO_PADS", 0, 0],
  ] as const) {
    const diode = circuit.selectOne(`.${name}`) as Diode
    const filter = { pcb_component_id: diode.pcb_component_id! }
    const authoredLabels = circuit.db.pcb_fabrication_note_text.list(filter)
    diode.updatePcbComponentSizeCalculation()
    diode.updatePcbComponentSizeCalculation()
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(
      expectedPaths,
    )
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(
      expectedLabels,
    )
    if (name === "D_AUTHORED" || name === "D_NAMED") {
      expect(circuit.db.pcb_fabrication_note_text.list(filter)).toEqual(
        authoredLabels,
      )
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
