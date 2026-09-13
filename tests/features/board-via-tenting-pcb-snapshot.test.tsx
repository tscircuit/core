import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB snapshot labels board tenting inheritance and per-via overrides", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    {
      label: "Inherited",
      pcbX: -25,
      tented: undefined,
      top: true,
      bottom: false,
    },
    { label: "tented=true", pcbX: -15, tented: true, top: true, bottom: true },
    {
      label: "tented=false",
      pcbX: -5,
      tented: false,
      top: false,
      bottom: false,
    },
    {
      label: "top_tented",
      pcbX: 5,
      tented: "top_tented",
      top: true,
      bottom: false,
    },
    {
      label: "bottom_tented",
      pcbX: 15,
      tented: "bottom_tented",
      top: false,
      bottom: true,
    },
  ] as const

  circuit.add(
    <board width={66} height={16} defaultViaTenting="top_tented">
      <pcbnotetext
        text="Board defaultViaTenting = top_tented"
        pcbY={5.5}
        fontSize={0.9}
      />
      {cases.map(({ label, pcbX, tented }, index) => (
        <group key={label} name={`Example${index}`}>
          <pcbnotetext text={label} pcbX={pcbX} pcbY={2.7} fontSize={0.65} />
          <via
            name={`V${index + 1}`}
            pcbX={pcbX}
            tented={tented}
            holeDiameter={0.6}
            outerDiameter={1.2}
          />
        </group>
      ))}
      <pcbnotetext text="Connector hole" pcbX={25} pcbY={2.7} fontSize={0.65} />
      <platedhole
        shape="circle"
        pcbX={25}
        holeDiameter={1.2}
        outerDiameter={2.4}
      />
      <pcbnotetext text="Unaffected" pcbX={25} pcbY={-2} fontSize={0.65} />
      <pcbnotetext
        text="Copper view | T/B: emitted tenting flags (1=covered, 0=exposed)"
        pcbY={-5.5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(cases.length)
  for (const { pcbX, top, bottom } of cases) {
    const via = vias.find((via) => via.x === pcbX)!
    expect([via.tented_on_top, via.tented_on_bottom]).toEqual([top, bottom])
    circuit.db.pcb_note_text.insert({
      text: `T=${Number(via.tented_on_top)} B=${Number(via.tented_on_bottom)}`,
      anchor_position: { x: pcbX, y: -2 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.65,
    })
  }
  const platedHole = circuit.db.pcb_plated_hole.list()[0]
  expect(platedHole).toMatchObject({ hole_diameter: 1.2, outer_diameter: 2.4 })
  expect(platedHole).not.toHaveProperty("tented_on_top")
  expect(platedHole).not.toHaveProperty("tented_on_bottom")

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 400,
    showPcbNotes: true,
  })
})
