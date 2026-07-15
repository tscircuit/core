import type * as Props from "@tscircuit/props"

type ShellUnitCompatible<ComponentProps> = Omit<ComponentProps, "name"> &
  (
    | { name: string }
    | {
        name?: string
        unitId: string
        pinMapping: Record<string, string>
      }
  )

export interface TscircuitElements {
  resistor: ShellUnitCompatible<Props.ResistorProps>
  capacitor: ShellUnitCompatible<Props.CapacitorProps>
  inductor: ShellUnitCompatible<Props.InductorProps>
  pushbutton: ShellUnitCompatible<Props.PushButtonProps>
  diode: ShellUnitCompatible<Props.DiodeProps>
  fuse: ShellUnitCompatible<Props.FuseProps>
  led: ShellUnitCompatible<Props.LedProps>
  board: Props.BoardProps
  drccheck: Props.DrcCheckProps
  mountedboard: Props.MountedBoardProps
  panel: Props.PanelProps
  subpanel: Props.SubpanelProps
  jumper: ShellUnitCompatible<Props.JumperProps>
  interconnect: ShellUnitCompatible<Props.InterconnectProps>
  solderjumper: ShellUnitCompatible<Props.SolderJumperProps>
  bug: ShellUnitCompatible<Props.ChipProps>
  potentiometer: ShellUnitCompatible<Props.PotentiometerProps>
  chip: ShellUnitCompatible<Props.ChipProps>
  pinout: ShellUnitCompatible<Props.PinoutProps>
  powersource: ShellUnitCompatible<Props.PowerSourceProps>
  schematicsection: Props.SchematicSectionProps
  schematicsheet: Props.SchematicSheetProps
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
  shell: Props.ShellProps
  netlabel: Props.NetLabelProps
  opamp: ShellUnitCompatible<Props.OpAmpProps>
  cadmodel: Props.CadModelProps
  cadassembly: Props.CadAssemblyProps
  net: Props.NetProps
  trace: Props.TraceProps
  differentialpair: Props.DifferentialPairProps
  breakout: Props.BreakoutProps
  breakoutpoint: Props.BreakoutPointProps
  fanout: Props.BreakoutProps
  fanoutpoint: Props.BreakoutPointProps
  autoroutingphase: Props.AutoroutingPhaseProps
  custom: any
  component: Props.ComponentProps
  crystal: ShellUnitCompatible<Props.CrystalProps>
  footprint: Props.FootprintProps & { name?: string }
  silkscreentext: Props.SilkscreenTextProps
  silkscreengraphic: Props.SilkscreenGraphicProps
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
  constraint: Props.ConstraintProps
  constrainedlayout: Props.ConstrainedLayoutProps
  battery: ShellUnitCompatible<Props.BatteryProps>
  connector: ShellUnitCompatible<Props.ConnectorProps>
  pinheader: ShellUnitCompatible<Props.PinHeaderProps>
  resonator: ShellUnitCompatible<Props.ResonatorProps>
  subcircuit: Props.SubcircuitGroupProps
  transistor: ShellUnitCompatible<Props.TransistorProps>
  switch: ShellUnitCompatible<Props.SwitchProps>
  mosfet: ShellUnitCompatible<Props.MosfetProps>
  testpoint: ShellUnitCompatible<Props.TestpointProps>
  voltagesource: ShellUnitCompatible<Props.VoltageSourceProps>
  currentsource: ShellUnitCompatible<Props.CurrentSourceProps>
  ammeter: ShellUnitCompatible<Props.AmmeterProps>
  voltageprobe: Props.VoltageProbeProps
  copperpour: Props.CopperPourProps
  analogsimulation: Props.AnalogSimulationProps
  spicemodel: Props.SpiceModelProps
  fiducial: Props.FiducialProps
  jscad: any
}
