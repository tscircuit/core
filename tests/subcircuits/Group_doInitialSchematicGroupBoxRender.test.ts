import { describe, it, expect } from "bun:test"
import { Group_doInitialSchematicGroupBoxRender } from "../../lib/components/primitive-components/Group/Group_doInitialSchematicGroupBoxRender"

type Pushed =
  | {
      type: "schematic_component"
      schematic_component_id: string
      subcircuit_id: string
      schematic_group_id: string
      refdes?: string
      title?: string
      width?: number
      height?: number
    }
  | {
      type: "schematic_box"
      schematic_box_id: string
      schematic_component_id: string
      subcircuit_id: string
    }
  | {
      type: "schematic_port"
      schematic_port_id: string
      schematic_component_id: string
      subcircuit_id: string
      name: string
      side: "left" | "right" | "top" | "bottom"
      order_index: number
      subcircuit_connectivity_map_key: string
    }

const makeDb = () => {
  const pushes: Pushed[] = []
  const counters: Record<string, number> = {}

  return {
    pushes,
    _newId: (kind: string) => {
      counters[kind] = (counters[kind] ?? 0) + 1
      return `${kind}_${counters[kind]}`
    },
    push: (obj: Pushed) => pushes.push(obj),
    update: (_id: string, _patch: any) => {}, // no-op stub
  }
}

const makeGroup = ({
  parsedProps = {},
  sckBySelector = {},
  hasIds = true,
}: {
  parsedProps?: any
  sckBySelector?: Record<string, string>
  hasIds?: boolean
}) => ({
  _parsedProps: parsedProps,
  subcircuit_id: hasIds ? "subcircuit_1" : undefined,
  schematic_group_id: hasIds ? "schematic_group_1" : undefined,
  selectOne: (sel: string) => {
    const sck = sckBySelector[sel]
    if (!sck) return undefined
    return {
      source_port: { subcircuit_connectivity_map_key: sck },
      subcircuit_connectivity_map_key: sck,
    }
  },
})

describe("Group_doInitialSchematicGroupBoxRender", () => {
  it("does nothing when showAsSchematicBox is false", () => {
    const db = makeDb()
    const group = makeGroup({ parsedProps: { showAsSchematicBox: false } })
    Group_doInitialSchematicGroupBoxRender(group as any, { db })
    expect(db.pushes.length).toBe(0)
  })

  it("creates schematic component and box with correct properties", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: {
        showAsSchematicBox: true,
        schBox: { title: "Regulator", refdes: "U1", width: 20, height: 10 },
        connections: {},
      },
    })

    Group_doInitialSchematicGroupBoxRender(group as any, { db })

    const comp = db.pushes.find((p) => p.type === "schematic_component")
    const box = db.pushes.find((p) => p.type === "schematic_box")

    expect(comp).toBeTruthy()
    expect(box).toBeTruthy()
    expect(comp!.subcircuit_id).toBe("subcircuit_1")
    expect(comp!.schematic_group_id).toBe("schematic_group_1")
    expect(comp!.refdes).toBe("U1")
    expect(comp!.title).toBe("Regulator")
    expect(comp!.width).toBe(20)
    expect(comp!.height).toBe(10)

    expect(box!.subcircuit_id).toBe("subcircuit_1")
    expect(box!.schematic_component_id).toBeDefined()
  })

  it("emits schematic ports with correct aliases, sides, and ordering", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: {
        showAsSchematicBox: true,
        connections: {
          VIN: ".reg > .vin",
          VOUT: ".reg > .vout",
          GND: ".reg > .gnd",
        },
        schPinArrangement: {
          left: { direction: "top-to-bottom", pins: ["VIN"] },
          right: {
            direction: "bottom-to-top",
            pins: ["VOUT"],
            gapAfterPins: ["VOUT"],
          },
          bottom: { direction: "left-to-right", pins: ["GND"] },
        },
      },
      sckBySelector: {
        ".reg > .vin": "SCK_VIN",
        ".reg > .vout": "SCK_VOUT",
        ".reg > .gnd": "SCK_GND",
      },
    })

    Group_doInitialSchematicGroupBoxRender(group as any, { db })

    const ports = db.pushes.filter((p) => p.type === "schematic_port")

    expect(ports.map((p) => p.name).sort()).toEqual(
      ["GND", "VIN", "VOUT"].sort(),
    )

    const vin = ports.find((p) => p.name === "VIN")!
    expect(vin.side).toBe("left")
    expect(vin.order_index).toBe(0)
    expect(vin.subcircuit_connectivity_map_key).toBe("SCK_VIN")

    const vout = ports.find((p) => p.name === "VOUT")!
    expect(vout.side).toBe("right")
    expect(vout.order_index).toBe(0)
    expect(vout.subcircuit_connectivity_map_key).toBe("SCK_VOUT")

    const gnd = ports.find((p) => p.name === "GND")!
    expect(gnd.side).toBe("bottom")
    expect(gnd.order_index).toBe(0)
    expect(gnd.subcircuit_connectivity_map_key).toBe("SCK_GND")
  })

  it("exits early if group lacks required ids", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: { showAsSchematicBox: true, connections: {} },
      hasIds: false,
    })
    Group_doInitialSchematicGroupBoxRender(group as any, { db })
    expect(db.pushes.length).toBe(0)
  })

  it("places un-arranged aliases on the right side after arranged pins", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: {
        showAsSchematicBox: true,
        connections: {
          A: ".x > .a",
          B: ".x > .b",
          C: ".x > .c",
        },
        schPinArrangement: {
          left: { pins: ["A"] }, // only A explicitly arranged
        },
      },
      sckBySelector: {
        ".x > .a": "SCK_A",
        ".x > .b": "SCK_B",
        ".x > .c": "SCK_C",
      },
    })

    Group_doInitialSchematicGroupBoxRender(group as any, { db })
    const ports = db.pushes.filter((p) => p.type === "schematic_port")

    const a = ports.find((p) => p.name === "A")!
    const b = ports.find((p) => p.name === "B")!
    const c = ports.find((p) => p.name === "C")!

    expect(a.side).toBe("left")
    expect(b.side).toBe("right")
    expect(c.side).toBe("right")
    expect(b.order_index).toBe(0)
    expect(c.order_index).toBe(1)
  })
})
