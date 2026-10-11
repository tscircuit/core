import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pill paste follows emitted pads through rotation and bottom-layer flips", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={14}>
      <chip
        name="U_top_0"
        layer="top"
        pcbRotation={0}
        pcbX={-9}
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_top_90"
        layer="top"
        pcbRotation={90}
        pcbX={-3}
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_top_180"
        layer="top"
        pcbRotation={180}
        pcbX={3}
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_top_270"
        layer="top"
        pcbRotation={270}
        pcbX={9}
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_bottom_0"
        layer="bottom"
        pcbRotation={0}
        pcbX={-9}
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_bottom_90"
        layer="bottom"
        pcbRotation={90}
        pcbX={-3}
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_bottom_180"
        layer="bottom"
        pcbRotation={180}
        pcbX={3}
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U_bottom_270"
        layer="bottom"
        pcbRotation={270}
        pcbX={9}
        pcbY={-3}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width={2}
              height={1}
              radius={0.5}
              pcbX={-1.5}
              pcbY={0.5}
              portHints={["1"]}
            />
            <smtpad
              shape="rotated_pill"
              width={2}
              height={1}
              radius={0.5}
              ccwRotation={30}
              pcbX={1.5}
              pcbY={-0.5}
              portHints={["2"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Top / bottom: 0, 90, 180, 270 degrees"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )
  circuit.render()
  const pads = circuit.db.pcb_smtpad.list()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(pads).toHaveLength(16)
  expect(apertures).toHaveLength(16)
  for (const pad of pads) {
    if (pad.shape !== "pill" && pad.shape !== "rotated_pill") {
      throw new Error("Expected pill pad")
    }
    const paste = apertures.find(
      (aperture) => aperture.pcb_smtpad_id === pad.pcb_smtpad_id,
    )
    expect(paste).toMatchObject({
      shape: pad.shape,
      x: pad.x,
      y: pad.y,
      layer: pad.layer,
      pcb_component_id: pad.pcb_component_id,
      pcb_group_id: pad.pcb_group_id,
      subcircuit_id: pad.subcircuit_id,
      width: 1.4,
      height: 0.7,
      radius: 0.35,
    })
    if (pad.shape === "rotated_pill") {
      expect(paste).toMatchObject({ ccw_rotation: pad.ccw_rotation })
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
