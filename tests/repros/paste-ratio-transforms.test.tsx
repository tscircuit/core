import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular paste ratios follow local pad axes through rotation and caching", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <chip name="DIRECT" pcbX={-6} pcbRotation={90}>
        <footprint>
          <smtpad
            shape="rect"
            width={4}
            height={2}
            portHints={["1"]}
            solderPasteMargin={0}
            {...{ solderPasteMarginRatio: { x: -0.1, y: -0.25 } }}
          />
        </footprint>
      </chip>
      <subcircuit name="CACHED" pcbX={6} _subcircuitCachingEnabled>
        <chip name="PAD" layer="bottom">
          <footprint>
            <smtpad
              shape="rect"
              width={4}
              height={2}
              portHints={["1"]}
              solderPasteMargin={0}
              {...{ solderPasteMarginRatio: { x: -0.1, y: -0.25 } }}
            />
          </footprint>
        </chip>
      </subcircuit>
      <pcbnotetext
        text="90 deg: 1 x 3.2 mm"
        pcbX={-6}
        pcbY={-5}
        fontSize={0.45}
      />
      <pcbnotetext
        text="Cached bottom: 3.2 x 1 mm"
        pcbX={6}
        pcbY={-5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  expect(circuit.db.pcb_solder_paste.list()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ x: -6, width: 1, height: 3.2, layer: "top" }),
      expect.objectContaining({
        x: 6,
        width: 3.2,
        height: 1,
        layer: "bottom",
      }),
    ]),
  )
})
