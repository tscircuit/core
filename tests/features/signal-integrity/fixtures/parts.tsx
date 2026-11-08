export const Inverter = (props: {
  name: string
  pcbX: number
  pcbY?: number
}) => (
  <>
    <chip
      name={props.name}
      manufacturerPartNumber="SN74LVC1G04DBV"
      footprint="sot23_5"
      pcbX={props.pcbX}
      pcbY={props.pcbY ?? 0}
      pinLabels={{ pin1: "NC", pin2: "A", pin3: "GND", pin4: "Y", pin5: "VCC" }}
    />
    <ibismodel
      componentRef={`.${props.name}`}
      ibisModelAsset={{
        project_relative_path: "models/sn74lvc1g04.ibs",
        url: "./models/sn74lvc1g04.ibs",
        mimetype: "text/plain",
      }}
      ibisComponentName="LVC1G04_DBV"
      ibisPinNameToPortLabel={{ "2": "A", "3": "GND", "4": "Y", "5": "VCC" }}
      ibisPinNameToModelName={{ "2": "LVC1G04_IN_33", "4": "LVC1G04_OUT_33" }}
      ibisPinNameToReferencePortLabels={{
        "2": {
          pullup: "VCC",
          pulldown: "GND",
          powerClamp: "VCC",
          groundClamp: "GND",
        },
        "4": {
          pullup: "VCC",
          pulldown: "GND",
          powerClamp: "VCC",
          groundClamp: "GND",
        },
      }}
    />
    <trace from={`.${props.name} > .VCC`} to="net.VCC" />
    <trace from={`.${props.name} > .GND`} to="net.GND" />
  </>
)

export const Supply = () => (
  <voltagesource
    name="V3V3"
    voltage="3.3V"
    connections={{ pin1: "net.VCC", pin2: "net.GND" }}
  />
)

/** Real TI eight-bit transceiver: a common receiving chip for data/strobe. */
export const Octal = ({
  name = "RX",
  pcbX = 12,
}: { name?: string; pcbX?: number }) => {
  const pins = Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [String(i + 3), `A${i + 1}`]),
  )
  return (
    <>
      <chip
        name={name}
        footprint="tssop24"
        pcbX={pcbX}
        pinLabels={Object.fromEntries(
          Object.entries(pins).map(([pin, label]) => [`pin${pin}`, label]),
        )}
      />
      <ibismodel
        componentRef={`.${name}`}
        ibisComponentName="LVC8T245_PW"
        ibisModelAsset={{
          project_relative_path: "models/sn74lvc8t245.ibs",
          url: "./models/sn74lvc8t245.ibs",
          mimetype: "text/plain",
        }}
        ibisPinNameToPortLabel={pins}
        ibisPinNameToModelName={Object.fromEntries(
          Object.keys(pins).map((pin) => [pin, "LVC8T245_IO_33"]),
        )}
      />
    </>
  )
}
