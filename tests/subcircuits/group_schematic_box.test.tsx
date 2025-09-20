// tests/Group_doInitialSchematicGroupBoxRender.test.ts
import { describe, it, expect } from "bun:test"
// If you use Bun's test runner instead, swap the import to:
// import { describe, it, expect } from "bun:test"

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
  let counters: Record<string, number> = {}
  const _newId = (kind: string) => {
    counters[kind] = (counters[kind] ?? 0) + 1
    return `${kind}_${counters[kind]}`
  }
  const push = (obj: Pushed) => pushes.push(obj)
  const update = (_id: string, _patch: any) => void 0
  return { pushes, _newId, push, update }
}

const makeGroup = (opts: {
  parsedProps?: any
  sckBySelector?: Record<string, string>
  hasIds?: boolean
}) => {
  const { parsedProps = {}, sckBySelector = {}, hasIds = true } = opts
  return {
    _parsedProps: parsedProps,
    subcircuit_id: hasIds ? "subcircuit_1" : undefined,
    schematic_group_id: hasIds ? "schematic_group_1" : undefined,
    // minimal selector helper used by the pass
    selectOne: (sel: string, _opts: any) => {
      const sck = sckBySelector[sel]
      if (!sck) return undefined
      return {
        // sometimes the SCK can be on source_port (supported in the pass)
        source_port: { subcircuit_connectivity_map_key: sck },
        // sometimes directly on the port (also supported in the pass)
        subcircuit_connectivity_map_key: sck,
      }
    },
  }
}

describe("Group_doInitialSchematicGroupBoxRender", () => {
  it("does nothing if showAsSchematicBox is not set", () => {
    const db = makeDb()
    const group = makeGroup({ parsedProps: { showAsSchematicBox: false } })
    Group_doInitialSchematicGroupBoxRender(group as any, { db })
    expect(db.pushes.length).toBe(0)
  })

  it("creates a logical component and a box attached to the group's schematic group", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: {
        showAsSchematicBox: true,
        schBox: { title: "Regulator", refdes: "U1", width: 20, height: 10 },
        connections: {},
      },
    })

    Group_doInitialSchematicGroupBoxRender(group as any, { db })

    const comp = db.pushes.find(
      (p): p is Extract<Pushed, { type: "schematic_component" }> =>
        p.type === "schematic_component",
    )
    const box = db.pushes.find(
      (p): p is Extract<Pushed, { type: "schematic_box" }> =>
        p.type === "schematic_box",
    )

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

  it("emits schematic_port aliases using SCK from internal ports", () => {
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

    const ports = db.pushes.filter(
      (p): p is Extract<Pushed, { type: "schematic_port" }> =>
        p.type === "schematic_port",
    )
    // Should have emitted exactly 3 ports
    expect(ports.map((p) => p.name).sort()).toEqual(
      ["GND", "VIN", "VOUT"].sort(),
    )

    // Side + order assertions
    const vin = ports.find((p) => p.name === "VIN")!
    const vout = ports.find((p) => p.name === "VOUT")!
    const gnd = ports.find((p) => p.name === "GND")!

    expect(vin.side).toBe("left")
    expect(vin.order_index).toBe(0)
    expect(vin.subcircuit_connectivity_map_key).toBe("SCK_VIN")

    // right, bottom-to-top reverses list; with a single item it's still index 0
    expect(vout.side).toBe("right")
    expect(vout.order_index).toBe(0)
    expect(vout.subcircuit_connectivity_map_key).toBe("SCK_VOUT")

    expect(gnd.side).toBe("bottom")
    expect(gnd.order_index).toBe(0)
    expect(gnd.subcircuit_connectivity_map_key).toBe("SCK_GND")
  })

  it("drops out early if group doesn't have required ids", () => {
    const db = makeDb()
    const group = makeGroup({
      parsedProps: { showAsSchematicBox: true, connections: {} },
      hasIds: false,
    })
    Group_doInitialSchematicGroupBoxRender(group as any, { db })
    expect(db.pushes.length).toBe(0)
  })

  it("puts un-arranged aliases on the right, after arranged pins", () => {
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
    const ports = db.pushes.filter(
      (p): p is Extract<Pushed, { type: "schematic_port" }> =>
        p.type === "schematic_port",
    )

    const a = ports.find((p) => p.name === "A")!
    const b = ports.find((p) => p.name === "B")!
    const c = ports.find((p) => p.name === "C")!

    expect(a.side).toBe("left")
    // B and C should be auto-placed on the right in insertion order
    expect(b.side).toBe("right")
    expect(c.side).toBe("right")
    expect(b.order_index).toBe(0)
    expect(c.order_index).toBe(1)
  })
})
