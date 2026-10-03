import { Fragment } from "react"
import type { PcbDdrRouting } from "@tscircuit/props"
const ddr = (
  signalClass: PcbDdrRouting["signalClass"],
  byteIndex?: 0 | 1,
): PcbDdrRouting => ({
  profile: "ti_am335x_ddr3",
  interfaceName: "DDR3",
  topology: "one_x16",
  signalClass,
  byteIndex,
  groundNetName: "GND",
  powerNetName: "DDR_1V5",
})
import ballMap from "./am3352-ballmap.json"
const pin = (signal: string) => {
  const ball = Object.entries(ballMap).find(([, s]) => s === signal)?.[0]
  if (!ball) throw new Error(`Unknown AM3352 signal: ${signal}`)
  return `.U1 > .${ball}`
}
// TI SPRS717L Tables 7-66 through 7-69. DQ groups retain associated strobes
// for routing; checks resolve strobe membership through the explicit pairs.
// The check-only ADDR_CTRL bus preserves existing routing membership/order.
// This declares requirements, not electrical sign-off. Stackup, impedance,
// planes, termination and decoupling still need validation; checks report them
// as unverified. RESETn is intentionally not an ADDR_CTRL member in Table 7-66.
export function TimingConstraints() {
  return (
    <>
      {([0, 1] as const).map((byte) => (
        <Fragment key={byte}>
          <bus
            name={`DDR_BYTE${byte}`}
            pcbDdrRouting={ddr("dq", byte)}
            routingPhaseIndex={1}
            maxLengthSkew={0.635}
            connections={[
              ...Array.from({ length: 8 }, (_, bit) =>
                pin(`DDR_D${byte * 8 + bit}`),
              ),
              pin(`DDR_DQM${byte}`),
              pin(`DDR_DQS${byte}`),
              pin(`DDR_DQSn${byte}`),
            ]}
          />
          <differentialpair
            name={`DDR_DQS_PAIR${byte}`}
            pcbDdrRouting={ddr("dqs", byte)}
            positiveConnection={pin(`DDR_DQS${byte}`)}
            negativeConnection={pin(`DDR_DQSn${byte}`)}
            maxLengthSkew={0.127}
            pcbTraceGap={0.12}
          />
        </Fragment>
      ))}
      <bus
        name="DDR_ADDR_CTRL"
        routingDisabled
        pcbDdrRouting={ddr("addr_ctrl")}
        connections={[
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
        ]}
      />
      <differentialpair
        name="DDR_CK_PAIR"
        pcbDdrRouting={ddr("ck")}
        positiveConnection={pin("DDR_CK")}
        negativeConnection={pin("DDR_CKn")}
        maxLengthSkew={0.127}
        pcbTraceGap={0.12}
      />
    </>
  )
}
