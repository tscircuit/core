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

test("an Amphenol 132289 edge-launch SMA has ground lands on both faces", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={16} routingDisabled schematicDisabled>
      <Amphenol132289 name="J1" layer="top" pcbX={-6.46} />
      <Amphenol132289 name="J2" layer="bottom" pcbX={6.46} />
      <pcbnotetext
        pcbY={7.12}
        fontSize={0.86}
        color="#8de2b3"
        text="Fix - SMA pads on both faces"
      />
      <pcbnotetext
        pcbY={5.91}
        fontSize={0.62}
        color="#c5d4e2"
        text="Top view - ground belongs on both faces"
      />
      <pcbnotetext pcbY={4.25} fontSize={0.64} color="#c5d4e2" text="GND" />
      <pcbnotetext pcbY={0} fontSize={0.64} color="#c5d4e2" text="SIGNAL" />
      <pcbnotetext pcbY={-4.25} fontSize={0.64} color="#c5d4e2" text="GND" />
      <pcbnotetext
        pcbX={-4.65}
        pcbY={-6.02}
        fontSize={0.72}
        color="#f2f4f7"
        text="J1  top mount"
      />
      <pcbnotetext
        pcbX={4.65}
        pcbY={-6.02}
        fontSize={0.72}
        color="#f2f4f7"
        text="J2  bottom mount"
      />
      <pcbnotetext
        pcbX={-4.65}
        pcbY={-7.24}
        fontSize={0.7}
        color="#8de2b3"
        text="3 top / 2 bottom"
      />
      <pcbnotetext
        pcbX={4.65}
        pcbY={-7.24}
        fontSize={0.7}
        color="#8de2b3"
        text="2 top / 3 bottom"
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
  expect(contacts("J1")).toEqual([
    ["bottom", "top"],
    ["top"],
    ["bottom", "top"],
  ])
  expect(contacts("J2")).toEqual([
    ["bottom", "top"],
    ["bottom"],
    ["bottom", "top"],
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "top",
    showPcbNotes: true,
  })
})
