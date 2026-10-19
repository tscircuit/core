import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Pad geometry and native <silkscreenrect> from the JLCEDA/EasyEDA imports.
// Keep the footprints inline so this visual repro needs no custom fixtures.
const leds = [
  {
    partNumber: "C540985",
    manufacturerPartNumber: "HL-C3535F3V3EA-ZW",
    pinLabels: { pin1: ["_NEG"], pin2: ["_POS"], pin3: ["pin3"] },
    footprint: (
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-1.4248638mm"
          pcbY="-0.0000254mm"
          width="0.7999984mm"
          height="3.7999924mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="1.4250162mm"
          pcbY="-0.0000254mm"
          width="0.7999984mm"
          height="3.7999924mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          points={[
            { x: "-0.679958mm", y: "1.8999708mm" },
            { x: "-0.679958mm", y: "0.0799846mm" },
            { x: "-0.679958mm", y: "0.0700024mm" },
            { x: "-0.409956mm", y: "0.0700024mm" },
            { x: "-0.409956mm", y: "-0.0700278mm" },
            { x: "-0.679958mm", y: "-0.0700278mm" },
            { x: "-0.679958mm", y: "-1.9000216mm" },
            { x: "0.680085mm", y: "-1.9000216mm" },
            { x: "0.680085mm", y: "-0.0700278mm" },
            { x: "0.4100576mm", y: "-0.0700278mm" },
            { x: "0.4100576mm", y: "0.0700024mm" },
            { x: "0.680085mm", y: "0.0700024mm" },
            { x: "0.680085mm", y: "1.8999708mm" },
            { x: "-0.679958mm", y: "1.8999708mm" },
            { x: "-0.679958mm", y: "1.8999708mm" },
          ]}
          shape="polygon"
        />
        <silkscreenrect
          pcbX="0mm"
          pcbY="0mm"
          width="4.151884mm"
          height="4.151884mm"
          strokeWidth="0.254mm"
        />
      </footprint>
    ),
  },
  {
    partNumber: "C540986",
    manufacturerPartNumber: "HL-C3535F4IR3EA-ZW",
    pinLabels: { pin1: ["A1"], pin2: ["A2"], pin3: ["C"] },
    footprint: (
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0mm"
          pcbY="-1.42494mm"
          width="3.4500058mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="-0mm"
          pcbY="1.42494mm"
          width="3.4500058mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="-0mm"
          pcbY="0mm"
          width="3.4500058mm"
          height="1.35001mm"
          shape="rect"
        />
        <silkscreenrect
          pcbX="0mm"
          pcbY="0mm"
          width="4.064mm"
          height="4.064mm"
          strokeWidth="0.254mm"
        />
      </footprint>
    ),
  },
]

test("JLC LED silkscreen rectangles stay axis-aligned at 45 degrees", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={52} height={34} routingDisabled>
      <pcbnotetext
        text="LED pads rotate; silkscreen rectangles stay axis-aligned"
        pcbY={14}
        fontSize={0.7}
      />
      <pcbnotetext text="0deg" pcbX={-4} pcbY={10} fontSize={0.9} />
      <pcbnotetext text="45deg" pcbX={13} pcbY={10} fontSize={0.9} />
      {leds.map((led, row) => (
        <Fragment key={led.partNumber}>
          <pcbnotetext
            text={led.partNumber}
            pcbX={-19}
            pcbY={4 - row * 12}
            fontSize={0.9}
          />
          {[0, 45].map((rotation, column) => (
            <chip
              key={rotation}
              name={`U${row * 2 + column + 1}`}
              manufacturerPartNumber={led.manufacturerPartNumber}
              supplierPartNumbers={{ jlcpcb: [led.partNumber] }}
              pinLabels={led.pinLabels}
              pcbX={-4 + column * 17}
              pcbY={4 - row * 12}
              pcbRotation={rotation}
              footprint={led.footprint}
            />
          ))}
        </Fragment>
      ))}
    </board>,
  )
  circuit.render()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 800,
    showFabricationNotes: false,
  })
})
