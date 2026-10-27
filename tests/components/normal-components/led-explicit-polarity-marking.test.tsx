import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit polarity intent controls fallback independently of note contents", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={48} height={18} routingDisabled>
      <led name="UNRELATED" footprint="0603" pcbX={-18}>
        <fabricationnotetext text="+" pcbY={2} fontSize={0.4} />
        <fabricationnotetext text="-" pcbY={-2} fontSize={0.4} />
        <fabricationnotepath
          route={[
            { x: -1, y: 3 },
            { x: 1, y: 3 },
          ]}
        />
      </led>
      <led name="FALSE_FLAG" footprint="0603" pcbX={-6}>
        <fabricationnotetext
          text="+"
          pcbY={2}
          fontSize={0.4}
          isPolarityMarking={false}
        />
        <fabricationnotetext text="-" pcbY={-2} fontSize={0.4} />
        <fabricationnotepath
          route={[
            { x: -1, y: 3 },
            { x: 1, y: 3 },
          ]}
          isPolarityMarking={false}
        />
      </led>
      <led name="CATHODE_BAR" footprint="0603" pcbX={6}>
        <fabricationnotepath
          route={[
            { x: 0.8, y: -0.5 },
            { x: 0.8, y: 0.5 },
          ]}
          isPolarityMarking
        />
      </led>
      <led name="CATHODE_TEXT" footprint="0603" pcbX={18}>
        <fabricationnotetext
          text="K"
          pcbX={0.8}
          fontSize={0.4}
          isPolarityMarking
        />
      </led>
      <pcbnotetext
        text="Unmarked +/- and false flag retain fallback; marked bar and K text replace it"
        pcbY={6}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [name, pathCount, markedCount] of [
    ["UNRELATED", 5, 4],
    ["FALSE_FLAG", 5, 4],
    ["CATHODE_BAR", 1, 1],
    ["CATHODE_TEXT", 0, 0],
  ] as const) {
    const led = circuit.selectOne(`.${name}`) as Led
    const filter = { pcb_component_id: led.pcb_component_id! }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    expect(paths).toHaveLength(pathCount)
    expect(paths.filter((note) => note.is_polarity_marking)).toHaveLength(
      markedCount,
    )
    const texts = circuit.db.pcb_fabrication_note_text.list(filter)
    for (let render = 0; render < 2; render++) {
      led.updatePcbComponentSizeCalculation()
      expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(
        pathCount,
      )
      expect(circuit.db.pcb_fabrication_note_text.list(filter)).toEqual(texts)
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
