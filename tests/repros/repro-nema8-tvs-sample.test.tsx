import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a saved VM route touching the TVS ground pad must report a short", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={18}
      height={12}
      routeRemaining={false}
      pcbRouteCache={{
        cacheKey: "nema8-tvs-short",
        pcbTraces: [
          {
            type: "pcb_trace",
            pcb_trace_id: "saved_vm_route",
            source_trace_id: "source_trace_0",
            route: [
              {
                route_type: "wire",
                x: -4,
                y: 0.825,
                width: 0.56,
                layer: "top",
                start_pcb_port_id: "pcb_port_0",
              },
              {
                route_type: "wire",
                x: 4,
                y: -1.65,
                width: 0.56,
                layer: "top",
                end_pcb_port_id: "pcb_port_3",
              },
            ],
          },
        ],
      }}
    >
      <capacitor
        name="C_VM_HF1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-4}
        pcbRotation={270}
      />
      <diode name="D_VM_TVS" footprint="sod123" pcbX={4} pcbRotation={270} />
      <trace from="C_VM_HF1.pin1" to="net.VM" />
      <trace from="D_VM_TVS.pin1" to="net.VM" />
      <trace from="C_VM_HF1.pin2" to="net.GND" />
      <trace from="D_VM_TVS.pin2" to="net.GND" />
      <pcbnotetext
        pcbY={4.7}
        text="NEMA8: saved VM copper ends on GND"
        fontSize={0.55}
      />
      <pcbnotetext pcbX={-6} pcbY={0.825} text="VM" fontSize={0.5} />
      <pcbnotetext pcbX={-6} pcbY={-0.825} text="GND" fontSize={0.5} />
      <pcbnotetext pcbX={6.3} pcbY={1.65} text="VM" fontSize={0.5} />
      <pcbnotetext pcbX={6.3} pcbY={-1.65} text="GND" fontSize={0.5} />
      <pcbnotetext
        pcbY={-4.7}
        text="Expected: flag the VM-to-GND contact"
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
  })
  expect(circuit.db.pcb_trace_error.list()).toContainEqual(
    expect.objectContaining({
      message:
        'PCB trace C_VM_HF1.pin1 to net.VM overlaps with pcb_smtpad "D_VM_TVS.pin2" (accidental contact)',
    }),
  )
})
