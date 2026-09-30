import { assembly, enclosure } from "lib"

export function EnclosureApertureDrcFixture({
  offset = 6,
  inAssembly = true,
  objUrl,
}: {
  offset?: number
  inAssembly?: boolean
  objUrl?: string
} = {}) {
  const content = (
    <>
      <board name="B1" width="40mm" height="24mm" routingDisabled>
        <pushbutton
          name="SW1"
          pcbY="11mm"
          allowOffBoard
          footprint={
            <footprint insertionDirection="from_top">
              <smtpad
                portHints={["pin1"]}
                width="2mm"
                height="2mm"
                shape="rect"
              />
            </footprint>
          }
          cadModel={
            objUrl
              ? { objUrl, modelOriginPosition: { x: 0, y: 0, z: 0 } }
              : {
                  jscad: {
                    type: "cuboid",
                    size: [8, 12, 6],
                    center: [0, 0, 3],
                  },
                  modelOriginPosition: { x: 0, y: 0, z: 0 },
                }
          }
        >
          <enclosure.cutoutaperture
            shape="rect"
            width="9mm"
            height="8mm"
            heightDimensionOffset={offset}
            margin="0.3mm"
          />
        </pushbutton>
        <pcbnotetext
          pcbX="0mm"
          pcbY="-8mm"
          text={`SW1 aperture offset ${offset} mm`}
          fontSize="1mm"
        />
      </board>
      <enclosure.fdm.box name="CASE" boardRef=".B1" topHeadroom="20mm" />
    </>
  )
  return inAssembly ? (
    <assembly.device>{content}</assembly.device>
  ) : (
    <group>{content}</group>
  )
}
