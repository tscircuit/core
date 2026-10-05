import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

// Synthetic two-pad footprints isolate placement transforms; the physical
// cable is USB-C. The pad row points along the declared insertion axis.
function DirectionFootprint() {
  return (
    <footprint insertionDirection="from_right">
      <smtpad
        portHints={["pin1"]}
        pcbX={-1.5}
        pcbY={0}
        width={1}
        height={1}
        shape="rect"
      />
      <smtpad
        portHints={["pin2"]}
        pcbX={1.5}
        pcbY={0}
        width={1}
        height={1}
        shape="rect"
      />
    </footprint>
  )
}

test("USB-C cable endpoint tangents follow emitted pad geometry at every quadrant on both layers", async () => {
  const panels = []
  for (const layer of ["top", "bottom"] as const) {
    for (const angle of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <board width={100} height={32} routingDisabled>
            <connector
              name="J1"
              standard="usb_c"
              pcbX={-38}
              pcbRotation={angle}
              layer={layer}
              pinLabels={{ pin1: "A", pin2: "B" }}
              footprint={<DirectionFootprint />}
            />
            <connector
              name="J2"
              standard="usb_c"
              pcbX={38}
              pcbRotation={angle}
              layer={layer}
              pinLabels={{ pin1: "A", pin2: "B" }}
              footprint={<DirectionFootprint />}
            />
          </board>
          <assembly.cable
            name="USB"
            from=".J1"
            to=".J2"
            standard={angle === 0 ? "usb_c" : undefined}
          />
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const cable = circuit.db.cad_cable.list()[0]!
      expect(cable.cableprinter_string).toBe("usb_c")
      const [padA, padB] = circuit.db.pcb_smtpad
        .list()
        .filter((pad) => pad.shape === "rect" || pad.shape === "rotated_rect")
        .slice(0, 2)
      const dx = padB!.x - padA!.x,
        dy = padB!.y - padA!.y
      const length = Math.hypot(dx, dy)
      const firstSegment = {
        x: cable.path[1]!.x - cable.path[0]!.x,
        y: cable.path[1]!.y - cable.path[0]!.y,
      }
      expect(firstSegment.x).toBeCloseTo((0.1 * dx) / length, 4)
      expect(firstSegment.y).toBeCloseTo((0.1 * dy) / length, 4)
      const last = cable.path.at(-1)!,
        previous = cable.path.at(-2)!
      expect(previous.x - last.x).toBeCloseTo(firstSegment.x, 4)
      expect(previous.y - last.y).toBeCloseTo(firstSegment.y, 4)
      expect(cable.path[0]!.z > 0).toBe(layer === "top")
      panels.push({
        title: `USB-C / ${layer} layer / ${angle} degrees`,
        code: `<connector name="J1"
  standard="usb_c"
  pcbX={-38} pcbRotation={${angle}}
  layer="${layer}"
  footprint={<DirectionFootprint />} />
<connector name="J2"
  standard="usb_c"
  pcbX={38} pcbRotation={${angle}}
  layer="${layer}"
  footprint={<DirectionFootprint />} />
<assembly.cable name="USB"
  from=".J1" to=".J2" />`,
        annotation:
          "Synthetic pads define the outward axis; actual USB-C cable meshes follow it.",
        circuit,
        renderOptions: {
          poppygl: {
            camPos: [-90, layer === "top" ? 110 : -110, 110] as [
              number,
              number,
              number,
            ],
            lookAt: [0, 0, 0] as [number, number, number],
            fov: 45,
          },
        },
      })
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "USB-C inference / endpoint direction follows rotated and flipped footprint pads",
    font: "alphabet",
    columns: 2,
    panels,
  })
})
