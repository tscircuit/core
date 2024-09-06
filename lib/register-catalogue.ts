import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"
import { SilkscreenPath } from "./components/primitive-components/SilkscreenPath"

extendCatalogue({
  ...Components,
  SilkscreenPath,
})

// Aliases
extendCatalogue({
  Bug: Components.Chip,
})
