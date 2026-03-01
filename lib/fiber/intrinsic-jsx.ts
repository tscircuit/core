import type * as Props from "@tscircuit/props"
import type { DetailedHTMLProps, SVGProps } from "react"

export interface TscircuitElements {
  resistor: Props.ResistorProps
  capacitor: Props.CapacitorProps
  inductor: Props.InductorProps
  pushbutton: Props.PushButtonProps
  diode: Props.DiodeProps
  fuse: Props.FuseProps
  led: Props.LedProps
  board: Props.BoardProps
  mountedboard: Props.MountedBoardProps
  panel: Props.PanelProps
  subpanel: Props.SubpanelProps
  jumper: Props.JumperProps
  interconnect: Props.InterconnectProps
  solderjumper: Props.SolderJumperProps
  bug: Props.ChipProps
  potentiometer: Props.PotentiometerProps
  // TODO use ChipProps once it gets merged in @tscircuit/props
  chip: Props.ChipProps
  pinout: Props.PinoutProps
  powersource: Props.PowerSourceProps
  via: Props.ViaProps
  schematicbox: Props.SchematicBoxProps
  schematicline: Props.SchematicLineProps
  schematicrect: Props.SchematicRectProps
  schematicarc: Props.SchematicArcProps
  schematiccircle: Props.SchematicCircleProps
  schematicpath: Props.SchematicPathProps
  schematictext: Props.SchematicTextProps
  schematictable: Props.SchematicTableProps
  schematicrow: Props.SchematicRowProps
  schematiccell: Props.SchematicCellProps
  smtpad: Props.SmtPadProps
  platedhole: Props.PlatedHoleProps
  keepout: Props.PcbKeepoutProps
  hole: Props.HoleProps
  port: Props.PortProps
  group: Props.GroupProps
  netlabel: Props.NetLabelProps
  opamp: Props.OpAmpProps
  cadmodel: Props.CadModelProps
  cadassembly: Props.CadAssemblyProps
  net: Props.NetProps
  trace: Props.TraceProps
  breakout: Props.BreakoutProps
  breakoutpoint: Props.BreakoutPointProps
  custom: any
  component: Props.ComponentProps
  crystal: Props.CrystalProps
  footprint: Props.FootprintProps & { name?: string }
  silkscreentext: Props.SilkscreenTextProps
  coppertext: Props.CopperTextProps
  cutout: Props.CutoutProps
  silkscreenpath: Props.SilkscreenPathProps
  silkscreenline: Props.SilkscreenLineProps
  silkscreenrect: Props.SilkscreenRectProps
  silkscreencircle: Props.SilkscreenCircleProps
  tracehint: Props.TraceHintProps
  courtyardcircle: Props.CourtyardCircleProps
  courtyardoutline: Props.CourtyardOutlineProps
  courtyardrect: Props.CourtyardRectProps
  pcbtrace: Props.PcbTraceProps
  fabricationnoterect: Props.FabricationNoteRectProps
  pcbnoteline: Props.PcbNoteLineProps
  pcbnoterect: Props.PcbNoteRectProps
  pcbnotetext: Props.PcbNoteTextProps
  pcbnotepath: Props.PcbNotePathProps
  pcbnotedimension: Props.PcbNoteDimensionProps
  fabricationnotetext: Props.FabricationNoteTextProps
  fabricationnotepath: Props.FabricationNotePathProps
  fabricationnotedimension: Props.FabricationNoteDimensionProps
  constraint: Props.ConstraintProps & { centerX?: number; centerY?: number }
  constrainedlayout: Props.ConstrainedLayoutProps
  battery: Props.BatteryProps
  pinheader: Props.PinHeaderProps
  resonator: Props.ResonatorProps
  subcircuit: Props.SubcircuitGroupProps
  transistor: Props.TransistorProps
  switch: Props.SwitchProps
  mosfet: Props.MosfetProps
  testpoint: Props.TestpointProps
  voltagesource: Props.VoltageSourceProps
  currentsource: Props.CurrentSourceProps
  voltageprobe: Props.VoltageProbeProps
  copperpour: Props.CopperPourProps
  analogsimulation: Props.AnalogSimulationProps
  fiducial: Props.FiducialProps
  jscad: any
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends TscircuitElements {}
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements extends TscircuitElements {
      switch:
        | DetailedHTMLProps<SVGProps<SVGSwitchElement>, SVGSwitchElement>
        | TscircuitElements["switch"]
    }
  }
}
