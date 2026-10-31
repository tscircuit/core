import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import { copperPourProps } from "@tscircuit/props"
import { CopperPour_doInitialPcbCopperPourRender } from "lib/components/primitive-components/CopperPour/CopperPour_doInitialPcbCopperPourRender"

test("copperpour preserves clearance, margin, thermal relief, and outline rule props on pcb_copper_pour", async () => {
  const outline = [
    { x: -8, y: -8 },
    { x: 8, y: -8 },
    { x: 8, y: 8 },
    { x: -8, y: 8 },
  ]

  const db = cju([
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 4,
      material: "fr4",
    },
    {
      type: "source_net",
      source_net_id: "source_net_0",
      name: "GND",
      member_source_group_ids: [],
      subcircuit_id: "subcircuit_source_group_0",
      subcircuit_connectivity_map_key:
        "subcircuit_source_group_0_connectivity_net0",
    },
  ] as any)

  const parsedProps = copperPourProps.parse({
    name: "GND_POUR",
    layer: "inner2",
    connectsTo: "net.GND",
    clearance: "0.3mm",
    padMargin: "0.35mm",
    traceMargin: "0.25mm",
    boardEdgeMargin: "0.4mm",
    cutoutMargin: "0.45mm",
    outline,
    useThermalReliefs: true,
    coveredWithSolderMask: true,
  })

  const asyncEffects: Array<() => Promise<void>> = []
  const fakeSubcircuit: any = {
    subcircuit_id: "subcircuit_source_group_0",
    root: {
      db,
      pcbDisabled: false,
      emit: () => {},
    },
    selectAll: (selector: string) =>
      selector === "copperpour" ? [copperPour] : [],
    selectOne: (selector: string) =>
      selector === "net.GND" ? { source_net_id: "source_net_0" } : null,
    _getBoard: () => ({ pcb_board_id: "pcb_board_0" }),
    getString: () => "<board />",
  }

  const copperPour: any = {
    _parsedProps: parsedProps,
    _isImplicitCopperPour: false,
    root: fakeSubcircuit.root,
    getSubcircuit: () => fakeSubcircuit,
    renderError: (msg: string) => {
      throw new Error(msg)
    },
    _queueAsyncEffect: (_name: string, fn: () => Promise<void>) => {
      asyncEffects.push(fn)
    },
  }

  CopperPour_doInitialPcbCopperPourRender(copperPour)
  for (const effect of asyncEffects) {
    await effect()
  }

  const copperPours = db.pcb_copper_pour.list()
  expect(copperPours.length).toBeGreaterThan(0)

  const pour = copperPours[0] as Record<string, unknown>
  expect(pour.layer).toBe("inner2")
  expect(pour.covered_with_solder_mask).toBe(true)
  expect(pour.clearance).toBe(0.3)
  expect(pour.pad_margin).toBe(0.35)
  expect(pour.trace_margin).toBe(0.25)
  expect(pour.board_edge_margin).toBe(0.4)
  expect(pour.cutout_margin).toBe(0.45)
  expect(pour.use_thermal_reliefs).toBe(true)
  expect(pour.thermal_relief_spoke_width).toBe(0.3)
  expect(pour.outline).toEqual(outline)
})
