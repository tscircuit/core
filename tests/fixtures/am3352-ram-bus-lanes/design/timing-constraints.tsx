import { Fragment } from "react"
const data = (byte: number) => [
  ...Array.from({ length: 8 }, (_, bit) => pin(`DDR_D${byte * 8 + bit}`)),
  pin(`DDR_DQM${byte}`),
]
const strobes = (byte: number) => [
  pin(`DDR_DQS${byte}`),
  pin(`DDR_DQSn${byte}`),
]
import ballMap from "./am3352-ballmap.json"
const pin = (signal: string) => {
  const ball = Object.entries(ballMap).find(([, s]) => s === signal)?.[0]
  if (!ball) throw new Error(`Unknown AM3352 signal: ${signal}`)
  return `.U1 > .${ball}`
}
// Values from TI SPRS717L Tables 7-66 through 7-69 belong to this design.
// Natural bus and pair props express data/strobe and address/clock matching.
// Physical stackup, reference planes, termination and decoupling still need
// separate validation. RESETn is not an ADDR_CTRL member in Table 7-66.
export function TimingConstraints() {
  const command = [
    ...Array.from({ length: 13 }, (_, bit) => pin(`DDR_A${bit}`)),
    ...Array.from({ length: 3 }, (_, bit) => pin(`DDR_BA${bit}`)),
    ...[
      "DDR_CSn0",
      "DDR_CASn",
      "DDR_RASn",
      "DDR_WEn",
      "DDR_CKE",
      "DDR_ODT",
    ].map(pin),
  ]
  const clock = [pin("DDR_CK"), pin("DDR_CKn")]
  return (
    <>
      {([0, 1] as const).map((byte) => (
        <Fragment key={byte}>
          <bus
            name={`DDR_BYTE${byte}`}
            routingPhaseIndex={1}
            preferredLayer={byte === 0 ? "inner1" : "inner2"}
            connections={data(byte)}
            lengthMatchTo={`.DDR_DQS_PAIR${byte}`}
            maxLengthSkew="25mil"
            maxLength={{ reference: "longest_manhattan" }}
            pcbTraceSpacing="3w"
            pcbSpacingToOtherSignals="4w"
            targetImpedanceMin="50ohm"
            targetImpedanceMax="75ohm"
          />
          <differentialpair
            name={`DDR_DQS_PAIR${byte}`}
            positiveConnection={strobes(byte)[0]!}
            negativeConnection={strobes(byte)[1]!}
            maxLengthSkew="5mil"
            pcbTraceGap={0.12}
            pcbSpacingToOtherSignals="4w"
            targetDifferentialImpedance="125±25ohm"
          />
        </Fragment>
      ))}
      <bus
        name="DDR_ADDR_CTRL"
        routingPhaseIndex={1}
        preferredLayer="bottom"
        connections={command}
        lengthMatchTo=".DDR_CK_PAIR"
        // The shared ±50mil window implies at most 100mil group skew.
        maxLengthSkew="100mil"
        targetLength={{
          reference: "longest_manhattan",
          of: [".DDR_ADDR_CTRL", ".DDR_CK_PAIR"],
          offset: "300mil",
        }}
        lengthTolerance="50mil"
        pcbTraceSpacing="3w"
        pcbSpacingToOtherSignals="4w"
        targetImpedanceMin="50ohm"
        targetImpedanceMax="75ohm"
      />
      <differentialpair
        name="DDR_CK_PAIR"
        positiveConnection={clock[0]!}
        negativeConnection={clock[1]!}
        maxLengthSkew="5mil"
        pcbTraceGap={0.12}
        targetLength={{
          reference: "longest_manhattan",
          of: [".DDR_ADDR_CTRL", ".DDR_CK_PAIR"],
          offset: "300mil",
        }}
        lengthTolerance="50mil"
        pcbSpacingToOtherSignals="4w"
        targetDifferentialImpedance="125±25ohm"
      />
    </>
  )
}
