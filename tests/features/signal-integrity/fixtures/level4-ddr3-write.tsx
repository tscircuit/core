/* LEVEL 4: AM335x -> W631GG6MB-12 DDR3 lower-byte write illustration, not JEDEC compliance.
 * Currently stops with: .CPU: coupled [Package Model] not implemented yet; scalar fallback is forbidden.
 * Typ corner is 1.5 V. DQS is delayed 0.5 UI to centre-align write sampling.
 * Setup/hold reuse the DDR3-1600 base values (10/45 ps), without slew derating
 * or separate AC/DC checks: Winbond A03, Table 54, p. 158:
 * https://media.digikey.com/pdf/Data%20Sheets/Winbond%20PDFs/W631GG6MB_A03.pdf#page=158
 * Footprinter ballcoords uses JEDEC rows: ZCZ 18x18 and Winbond 16x9 with columns 4-6 absent,
 * both 0.8 mm pitch, 0.4 mm pads. pinLabels keys are physical balls; DQSL_N aliases DQSL#.
 * Only this byte lane and representative ideal rail balls are labelled/wired;
 * unused balls retain coordinates. Address/command, the upper byte and boot circuitry are omitted.
 */
const cpuDq = ["M3", "M4", "N1", "N2", "N3", "N4", "P3", "P4"]
const dramDq = ["E3", "F7", "F2", "F8", "H3", "H8", "G2", "H7"]
const cpuPins = {
  ...Object.fromEntries(cpuDq.map((ball, i) => [ball, `DDR_D${i}`])),
  P1: "DDR_DQS0",
  P2: "DDR_DQSN0",
  E5: "VDDS_DDR",
  A1: "VSS",
}
const dramPins = {
  ...Object.fromEntries(dramDq.map((ball, i) => [ball, `DQL${i}`])),
  F3: "DQSL",
  G3: "DQSL_N",
  A1: "VDDQ",
  B1: "VSSQ",
}
const missing = [..."ABCDEFGHJKLMNPRT"]
  .flatMap((row) => [4, 5, 6].map((col) => `${row}${col}`))
  .join(",")
const references = (balls: string[], high: string, low: string) =>
  Object.fromEntries(
    balls.map((ball) => [
      ball,
      { pullup: high, pulldown: low, powerClamp: high, groundClamp: low },
    ]),
  )

export default () => (
  <board
    width="60mm"
    height="35mm"
    layers={4}
    fabricatorPreset="jlcpcb_standard"
  >
    <chip
      name="CPU"
      manufacturerPartNumber="AM3358BZCZ100"
      pcbX={-15}
      footprint="bga324_grid18x18_p0.8mm_pad0.4mm_tlorigin_pinnumbering(ballcoords)"
      pinLabels={cpuPins}
    />
    <chip
      name="DRAM"
      manufacturerPartNumber="W631GG6MB-12"
      pcbX={15}
      footprint={`bga96_grid9x16_p0.8mm_pad0.4mm_missing(${missing})_tlorigin_pinnumbering(ballcoords)`}
      pinLabels={dramPins}
    />
    <ibismodel
      componentRef=".CPU"
      ibisModelAsset={{
        project_relative_path: "models/sprm552c.ibs",
        url: "./models/sprm552c.ibs",
        mimetype: "text/plain",
      }}
      ibisComponentName="am335x_zcz"
      ibisPinNameToPortLabel={cpuPins}
      ibisPinNameToModelName={Object.fromEntries(
        cpuDq.map((ball) => [ball, "Model_257"]),
      )}
      ibisPinNameToReferencePortLabels={references(
        [...cpuDq, "P1", "P2"],
        "VDDS_DDR",
        "VSS",
      )}
    />
    <ibismodel
      componentRef=".DRAM"
      ibisModelAsset={{
        project_relative_path: "models/W631GG6MB-12.ibs",
        url: "./models/W631GG6MB-12.ibs",
        mimetype: "text/plain",
      }}
      ibisComponentName="W631GG6MB-12"
      ibisPinNameToPortLabel={dramPins}
      ibisPinNameToModelName={Object.fromEntries(
        dramDq.map((ball) => [ball, "ODT_off"]),
      )}
      ibisPinNameToReferencePortLabels={references(
        [...dramDq, "F3", "G3"],
        "VDDQ",
        "VSSQ",
      )}
    />
    <trace from=".CPU > .VDDS_DDR" to="net.VDDQ" />
    <trace from=".DRAM > .VDDQ" to="net.VDDQ" />
    <trace from=".CPU > .VSS" to="net.GND" />
    <trace from=".DRAM > .VSSQ" to="net.GND" />
    {cpuDq.map((_, i) => (
      <trace
        key={String(i)}
        from={`.CPU > .DDR_D${i}`}
        to={`.DRAM > .DQL${i}`}
      />
    ))}
    <trace from=".CPU > .DDR_DQS0" to=".DRAM > .DQSL" />
    <trace from=".CPU > .DDR_DQSN0" to=".DRAM > .DQSL_N" />
    <differentialpair
      positiveConnection=".CPU > .DDR_DQS0"
      negativeConnection=".CPU > .DDR_DQSN0"
    />
    <copperpour connectsTo="net.GND" layer="inner1" />

    <signalintegrity name="WRITE" bitRate="800Mbps" corner="typ">
      <signal
        name="DQS"
        driver={{
          pin: { p: ".CPU > .DDR_DQS0", n: ".CPU > .DDR_DQSN0" },
          model: { p: "Model_579", n: "Model_771" },
        }}
        receiver={{
          pin: { p: ".DRAM > .DQSL", n: ".DRAM > .DQSL_N" },
          model: { p: "ODT_off", n: "ODT_off" },
        }}
        pattern="clock"
        offset="0.5UI"
      />
      {cpuDq.map((_, i) => (
        <signal
          key={i}
          name={`DQ${i}`}
          driver={{ pin: `.CPU > .DDR_D${i}`, model: "Model_257" }}
          receiver={{ pin: `.DRAM > .DQL${i}`, model: "ODT_off" }}
          strobe="DQS"
          mask={{ setup: "10ps", hold: "45ps" }}
        />
      ))}
    </signalintegrity>
  </board>
)
