import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["ANT"],
  pin2: ["pin2"],
} as const

export const A_2450AT18A100E = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: -0.2, y: 0.2 },
            ]}
            strokeColor="#8D2323"
          />
          <schematicpath
            points={[
              { x: 0.2, y: 0.2 },
              { x: 0, y: 0 },
            ]}
            strokeColor="#8D2323"
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0, y: -0.2 },
            ]}
            strokeColor="#8D2323"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["ANT"]}
            direction="down"
            schX={0}
            schY={-0.4}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0, y: 0.3 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="up"
            schX={0}
            schY={0.3}
            schStemLength={0.2}
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C89334"],
      }}
      manufacturerPartNumber="2450AT18A100E"
      footprint="smdpads2_p3.1562mm_pw1mm_ph1.75mm"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.obj?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C89334.step?uuid=cbaa998426f54032b453ce6fafc2cd5a",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...props}
    />
  )
}
