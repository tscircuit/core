import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("six independent paste windows share one continuous exposed copper pad", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={12} height={12} routingDisabled schematicDisabled>
        <subcircuit name="WINDOWS" _subcircuitCachingEnabled={cached}>
          <chip
            name="U1"
            footprint={
              <footprint>
                <smtpad
                  shape="rect"
                  width={4}
                  height={5}
                  layer="top"
                  portHints={["1"]}
                  solderPasteMargin={-2}
                />
                {[-1, 1].map((pcbX) =>
                  [-1.6, 0, 1.6].map((pcbY) => (
                    <Fragment key={`${pcbX},${pcbY}`}>
                      <solderpaste
                        shape="rect"
                        width={1.6}
                        height={1.2}
                        pcbX={pcbX}
                        pcbY={pcbY}
                        layer="top"
                      />
                    </Fragment>
                  )),
                )}
              </footprint>
            }
          />
        </subcircuit>
        <pcbnotetext
          text="One copper pad / six paste windows"
          pcbY={-4}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const [pad] = circuit.db.pcb_smtpad.list()
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
    expect(pad).toMatchObject({ shape: "rect", width: 4, height: 5 })
    expect(pad!.is_covered_with_solder_mask).not.toBe(true)
    const apertures = circuit.db.pcb_solder_paste.list()
    expect(apertures).toHaveLength(6)
    for (const aperture of apertures) {
      expect(any_circuit_element.parse(aperture)).toEqual(aperture)
      expect(aperture.pcb_smtpad_id).toBeUndefined()
      expect(aperture.pcb_component_id).toBe(pad!.pcb_component_id)
      expect(aperture).toMatchObject({
        shape: "rect",
        width: 1.6,
        height: 1.2,
        layer: "top",
      })
      if (pad!.shape !== "rect" || aperture.shape !== "rect")
        throw new Error("Expected rectangles")
      expect(Math.abs(aperture.x - pad!.x) + aperture.width / 2).toBeLessThan(
        pad!.width / 2,
      )
      expect(Math.abs(aperture.y - pad!.y) + aperture.height / 2).toBeLessThan(
        pad!.height / 2,
      )
      for (const other of apertures) {
        if (other === aperture || other.shape !== "rect") continue
        expect(
          Math.abs(aperture.x - other.x) > (aperture.width + other.width) / 2 ||
            Math.abs(aperture.y - other.y) >
              (aperture.height + other.height) / 2,
        ).toBe(true)
      }
    }
    await expect(circuit).toMatchPcbSnapshot(
      cached
        ? import.meta.path.replace(".test.tsx", "-cached.test.tsx")
        : import.meta.path,
      {
        showSolderPaste: true,
      },
    )
  }
})
