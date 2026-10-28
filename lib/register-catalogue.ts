import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"

// Register all components, generally you don't need to manually
// register a component, as long as it's exported from lib/components
// it'll automatically be registered!
extendCatalogue(Components)

// Aliases (only when class name is different than the name of the component)
extendCatalogue({
  "assembly.drawing.dimension": Components.AssemblyDrawingDimension,
  "assembly.drawing.page": Components.AssemblyDrawingPage,
  "assembly.drawing.partview": Components.AssemblyDrawingPartView,
  "assembly.drawing.titleblock": Components.AssemblyDrawingTitleBlock,
  "assembly.cable": Components.AssemblyCable,
  "assembly.device": Components.AssemblyDevice,
  "assembly.explosion.stage": Components.AssemblyExplosionStage,
  "assembly.explosion.move": Components.AssemblyExplosionMove,
  "assembly.motor": Components.AssemblyMotor,
  "assembly.part": Components.AssemblyPart,
  "assembly.referencesurface": Components.AssemblyReferenceSurface,
  "assembly.printedpart": Components.AssemblyPrintedPart,
  "assembly.screen": Components.AssemblyScreen,
  "assembly.subassembly": Components.AssemblySubassembly,
  "assembly.cadassembly": Components.AssemblySubassembly,
  Bug: Components.Chip,
  "enclosure.cutoutaperture": Components.EnclosureCutoutAperture,
  "enclosure.fdm.box": Components.EnclosureFdmBox,
  Fanout: Components.Breakout,
  FanoutPoint: Components.BreakoutPoint,
})
