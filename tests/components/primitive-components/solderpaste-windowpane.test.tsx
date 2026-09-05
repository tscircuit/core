import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone solderpaste creates windowpanes over one continuous copper pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={26} routingDisabled>
      <chip
        name="CONTACT"
        footprint={
          <footprint>
            <smtpad shape="circle" radius={10} solderPasteMargin={-10} />
            {[-5, 0, 5].flatMap((pcbX) =>
              [-5, 0, 5].map((pcbY) => (
                <Fragment key={`${pcbX},${pcbY}`}>
                  <solderpaste
                    shape="rect"
                    width={3}
                    height={3}
                    pcbX={pcbX}
                    pcbY={pcbY}
                  />
                </Fragment>
              )),
            )}
          </footprint>
        }
      />
      <pcbnotetext
        text="9 paste apertures / 1 continuous copper pad"
        pcbY={11.5}
        fontSize={0.7}
      />
    </board>,
  )
  circuit.render()

  const copper = circuit.db.pcb_smtpad.list()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(copper).toHaveLength(1)
  expect(copper[0]).toMatchObject({ shape: "circle", radius: 10 })
  expect(paste).toHaveLength(9)
  expect(new Set(paste.map(({ x, y }) => `${x},${y}`))).toEqual(
    new Set([-5, 0, 5].flatMap((x) => [-5, 0, 5].map((y) => `${x},${y}`))),
  )
  for (const aperture of paste) {
    expect(aperture).toMatchObject({
      shape: "rect",
      width: 3,
      height: 3,
      layer: "top",
      pcb_component_id: copper[0]!.pcb_component_id,
    })
    expect(aperture.pcb_smtpad_id).toBeUndefined()
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
