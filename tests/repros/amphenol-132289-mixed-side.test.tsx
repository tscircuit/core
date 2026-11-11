import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// All five lands of KiCad's SMA_Amphenol_132289_EdgeMount (KiCad 10.0.0).
// https://gitlab.com/kicad/libraries/kicad-footprints/-/blob/10.0.0/Connector_Coaxial.pretty/SMA_Amphenol_132289_EdgeMount.kicad_mod
function Amphenol132289({
  name,
  layer,
  pcbX,
}: {
  name: string
  layer: "top" | "bottom"
  pcbX: number
}) {
  const land = { shape: "rect", width: 5.08, height: 1.5 } as const
  return (
    <chip
      name={name}
      layer={layer}
      pcbX={pcbX}
      pinLabels={{ 1: "SIGNAL", 2: "GND" }}
      footprint={
        <footprint originalLayer="top">
          <smtpad {...land} portHints={["pin1"]} layer="top" />
          <smtpad {...land} portHints={["pin2"]} layer="top" pcbY={-4.25} />
          <smtpad {...land} portHints={["pin2"]} layer="bottom" pcbY={-4.25} />
          <smtpad {...land} portHints={["pin2"]} layer="top" pcbY={4.25} />
          <smtpad {...land} portHints={["pin2"]} layer="bottom" pcbY={4.25} />
        </footprint>
      }
    />
  )
}

test("an explicit mounting side collapses all five Amphenol 132289 lands onto one face", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={16} routingDisabled schematicDisabled>
      <Amphenol132289 name="J1" layer="top" pcbX={-6.46} />
      <Amphenol132289 name="J2" layer="bottom" pcbX={6.46} />
      <pcbnotetext text="J1  top mount" pcbX={-6} pcbY={-6.5} fontSize={0.65} />
      <pcbnotetext
        text="J2  bottom mount"
        pcbX={6}
        pcbY={-6.5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const contacts = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })!
    const component = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === component.pcb_component_id)
    const layersAt = (pcbY: number) =>
      pads
        .filter((pad) => "y" in pad && Math.abs(pad.y - pcbY) < 1e-6)
        .map((pad) => pad.layer)
        .sort()
    return [layersAt(-4.25), layersAt(0), layersAt(4.25)]
  }
  expect(contacts("J1")).toEqual([["top", "top"], ["top"], ["top", "top"]])
  expect(contacts("J2")).toEqual([
    ["bottom", "bottom"],
    ["bottom"],
    ["bottom", "bottom"],
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "top",
    showPcbNotes: true,
  })
})
