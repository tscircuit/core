import { beforeAll, expect, test } from "bun:test"
import {
  getUsbCEpaperViaPortFixture,
  verifyUsbCEpaperSource,
  type UsbCEpaperViaPortFixture,
} from "tests/fixtures/usb-c-epaper-rp2354b"
import { renderUsbCEpaperViaPorts } from "tests/fixtures/usb-c-epaper-rp2354b/render-via-ports"

let fixture: UsbCEpaperViaPortFixture

beforeAll(async () => {
  verifyUsbCEpaperSource()
  fixture = await getUsbCEpaperViaPortFixture()
  expect(fixture.circuit.db.source_component.list()).toHaveLength(76)
  expect(fixture.circuit.db.source_net.list()).toHaveLength(42)
  expect(fixture.viaPorts).toHaveLength(84)
  expect(fixture.displayEndpoints).toHaveLength(14)
  for (const via of fixture.viaPorts) {
    expect(via.expectedLayers).toEqual(["top", "inner1", "inner2", "bottom"])
  }
  // Snapshot or fixture failures must not satisfy the expected-failure test.
  await expect(renderUsbCEpaperViaPorts(fixture)).toMatchSvgSnapshot(
    import.meta.path,
    undefined,
    { diffThresholdPercent: 0 },
  )
}, 60_000)

test("the real e-paper board exposes every via layer and resolves its display bus", () => {
  expect(fixture.renderError).toBeNull()
  for (const via of fixture.viaPorts) {
    expect(via.sourcePorts.map((port) => port.name)).toEqual(via.expectedLayers)
  }
  expect(fixture.circuit.db.source_trace_not_connected_error.list()).toEqual([])
  const bus = fixture.circuit.db.source_bus
    .list()
    .find((bus) => bus.name === "DISPLAY_INTERCONNECT")
  expect(bus?.source_trace_ids).toHaveLength(7)
  expect(fixture.circuit.db.pcb_via.list()).toHaveLength(84)
  expect(
    fixture.circuit.db.pcb_via
      .list()
      .every((via) => via.pcb_port_ids?.length === 4),
  ).toBe(true)
})
