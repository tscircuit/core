import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved straight fanout path on BGA works with routeRemaining", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const escapes: FanoutTracePath[] = [
    {
      connection: ".U1 > port.pin1",
      route: [
        { route_type: "wire", x: -2.5, y: -2.5, width: 0.15, layer: "top" },
        { route_type: "wire", x: -2.5, y: -4, width: 0.15, layer: "top" },
      ],
    },
  ]
  circuit.add(
    <board width="20mm" height="20mm" layers={4} routeRemaining>
      <fanout pcbTracePaths={escapes}>
        <chip
          name="U1"
          footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
        />
      </fanout>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-8}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
}, 20_000)

test("saved dogbone fanout path on BGA works with routeRemaining", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const escapes: FanoutTracePath[] = [
    {
      connection: ".U1 > port.pin1",
      route: [
        { route_type: "wire", x: -2.5, y: -2.5, width: 0.15, layer: "top" },
        { route_type: "wire", x: -2, y: -2, width: 0.15, layer: "top" },
        {
          route_type: "via",
          x: -2,
          y: -2,
          from_layer: "top",
          to_layer: "inner1",
        },
      ],
    },
  ]
  circuit.add(
    <board width="20mm" height="20mm" layers={4} routeRemaining>
      <fanout pcbTracePaths={escapes}>
        <chip
          name="U1"
          footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
        />
      </fanout>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-8}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
}, 20_000)

test("live dogbone fanout on BGA works with routeRemaining", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board width="20mm" height="20mm" layers={4} routeRemaining>
      <fanout autorouter="dogbone">
        <chip
          name="U1"
          footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
        />
      </fanout>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-8}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
}, 20_000)

test("autoroutingphase fanout pcbTracePaths on BGA works with routeRemaining", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const escapes: FanoutTracePath[] = [
    {
      connection: ".U1 > port.pin1",
      route: [
        { route_type: "wire", x: -2.5, y: -2.5, width: 0.15, layer: "top" },
        { route_type: "wire", x: -2.5, y: -4, width: 0.15, layer: "top" },
      ],
    },
  ]
  circuit.add(
    <board width="20mm" height="20mm" layers={4} routeRemaining>
      <autoroutingphase autorouter="fanout" pcbTracePaths={escapes} />
      <chip
        name="U1"
        footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-8}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
}, 20_000)

test("autoroutingphase fanout dogbone pcbTracePaths on BGA works with routeRemaining", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const escapes: FanoutTracePath[] = [
    {
      connection: ".U1 > port.pin1",
      route: [
        { route_type: "wire", x: -2.5, y: -2.5, width: 0.15, layer: "top" },
        { route_type: "wire", x: -2, y: -2, width: 0.15, layer: "top" },
        {
          route_type: "via",
          x: -2,
          y: -2,
          from_layer: "top",
          to_layer: "inner1",
        },
      ],
    },
  ]
  circuit.add(
    <board width="20mm" height="20mm" layers={4} routeRemaining>
      <autoroutingphase autorouter="fanout" pcbTracePaths={escapes} />
      <chip
        name="U1"
        footprint="bga36_grid6x6_p1mm_w6mm_h6mm_pad0.5mm_circularpads"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-8}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
}, 20_000)
