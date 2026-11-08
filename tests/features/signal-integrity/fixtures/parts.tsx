export const Inverter = (props: {
  name: string
  pcbX: number
  pcbY?: number
}) => (
  <>
    <chip
      name={props.name}
      manufacturerPartNumber="SN74LVC1G04DCK"
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
      ibisComponentName="LVC1G04_DCK"
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
