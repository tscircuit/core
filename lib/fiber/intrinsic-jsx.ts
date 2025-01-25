import type * as Props from "@tscircuit/props"

export interface TscircuitElements {
  // For testing invalid components
  unknowncomponent: any
  resistor: Props.ResistorProps
  capacitor: Props.CapacitorProps
  inductor: Props.InductorProps
  pushbutton: Props.PushButtonProps
  diode: Props.DiodeProps
  led: Props.LedProps
  board: Props.BoardProps
  jumper: Props.JumperProps
  bug: Props.ChipProps
  potentiometer: Props.PotentiometerProps
  // TODO use ChipProps once it gets merged in @tscircuit/props
  chip: Props.ChipProps
  powersource: Props.PowerSourceProps
  via: Props.ViaProps
  schematicbox: Props.SchematicBoxProps
  schematicline: Props.SchematicLineProps
  schematicpath: Props.SchematicPathProps
  schematictext: Props.SchematicTextProps
  smtpad: Props.SmtPadProps
  platedhole: Props.PlatedHoleProps
  keepout: Props.PcbKeepoutProps
  hole: Props.HoleProps
  port: Props.PortProps
  group: Props.GroupProps
  netalias: Props.NetAliasProps
  net: Props.NetProps
  trace: Props.TraceProps
  custom: any
  component: Props.ComponentProps
  footprint: any
  silkscreentext: Props.SilkscreenTextProps
  silkscreenpath: Props.SilkscreenPathProps
  silkscreenline: Props.SilkscreenLineProps
  silkscreenrect: Props.SilkscreenRectProps
  silkscreencircle: Props.SilkscreenCircleProps
  tracehint: Props.TraceHintProps
  pcbtrace: Props.PcbTraceProps
  fabricationnotetext: Props.FabricationNoteTextProps
  fabricationnotepath: Props.FabricationNotePathProps
  constraint: Props.ConstraintProps
  constrainedlayout: Props.ConstrainedLayoutProps
  battery: Props.BatteryProps
  pinheader: Props.PinHeaderProps
  resonator: Props.ResonatorProps
  subcircuit: Props.SubcircuitGroupProps
  transistor: Props.TransistorProps
  mosfet: Props.MosfetProps
  jscad: any
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends TscircuitElements {}
  }
}
declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements extends TscircuitElements {}
  }
}
