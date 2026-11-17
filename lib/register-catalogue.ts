import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"

// Register simulation.ibismodel only under its namespaced host.
const { SimulationIbisModel, ...components } = Components
extendCatalogue(components)

// Aliases (only when class name is different than the name of the component)
extendCatalogue({
  "assembly.drawing.dimension": Components.AssemblyDrawingDimension,
  "assembly.drawing.explosionview": Components.AssemblyDrawingExplosionView,
  "assembly.drawing.stage": Components.AssemblyDrawingStage,
  "assembly.drawing.partlabel": Components.AssemblyDrawingPartLabel,
  "assembly.drawing.note": Components.AssemblyDrawingNote,
  "assembly.drawing.page": Components.AssemblyDrawingPage,
  "assembly.drawing.partview": Components.AssemblyDrawingPartView,
  "assembly.drawing.titleblock": Components.AssemblyDrawingTitleBlock,
  "assembly.cable": Components.AssemblyCable,
  "assembly.device": Components.AssemblyDevice,
  "assembly.explosion.stage": Components.AssemblyExplosionStage,
  "assembly.explosion.move": Components.AssemblyExplosionMove,
  "assembly.motor": Components.AssemblyMotor,
  "assembly.bolt": Components.AssemblyBolt,
  "assembly.part": Components.AssemblyPart,
  "assembly.referencesurface": Components.AssemblyReferenceSurface,
  "assembly.printedpart": Components.AssemblyPrintedPart,
  "assembly.screen": Components.AssemblyScreen,
  "assembly.subassembly": Components.AssemblySubassembly,
  "assembly.cadassembly": Components.AssemblySubassembly,
  "simulation.ibismodel": SimulationIbisModel,
  Bug: Components.Chip,
  "enclosure.cutoutaperture": Components.EnclosureCutoutAperture,
  "enclosure.fdm.box": Components.EnclosureFdmBox,
  Fanout: Components.Breakout,
  FanoutPoint: Components.BreakoutPoint,
})
