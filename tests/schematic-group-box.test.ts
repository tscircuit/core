import { RootCircuit } from "../lib/RootCircuit"
import { Group } from "../lib/components/primitive-components/Group/Group"
// Adjust this import to match your repo (see step 3)
import { PinHeader } from "../lib/components/normal-components/PinHeader"
import { test, expect } from "bun:test"
test("subcircuit renders as one schematic box with SCK pins", () => {
  const root: any = new RootCircuit()
  // enable schematic routing feature used by the group render pass
  ;(root as any)._featureMspSchematicTraceRouting = true

  // create a subcircuit group
  const group: any = new Group({ subcircuit: true, name: "Shield" })
  ;(group as any).parent = root // attach to root circuit
  // set the core-only props directly (we read from _parsedProps)
  group._parsedProps = {
    ...(group._parsedProps ?? {}),
    showAsSchematicBox: true,
    connections: { D1: "J1.pin1", D2: "J2.pin1" },
    schPinArrangement: { leftSide: { direction: "top-to-bottom", pins: ["D1","D2"] } },
    schBox: { title: "Arduino Shield" },
  }

  // add two pin headers inside the subcircuit
  const j1 = new PinHeader({ name: "J1", pinCount: 3 })
  const j2 = new PinHeader({ name: "J2", pinCount: 3 })
  group.add?.(j1); group.add?.(j2)
  root.add?.(group)

  // build/emit circuit json (this triggers schematic rendering passes)
  const cj: any = root.toCircuitJSON?.() ?? (root as any).toCircuitJSON()

  // box exists
  const comp = cj.schematic_component.find((c: any) => c.is_schematic_group && c.name === "Arduino Shield")
  expect(comp).toBeTruthy()

  // pins exist and carry SCKs
  const pins = cj.schematic_pin.filter((p: any) => p.parent_component_id === comp.schematic_component_id)
  expect(pins.map((p: any) => p.group_box_pin_name)).toEqual(["D1","D2"])
  pins.forEach((p: any) => {
    expect(typeof p.subcircuit_connectivity_map_key).toBe("string")
    expect(p.subcircuit_connectivity_map_key.length).toBeGreaterThan(0)
  })
})
