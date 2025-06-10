declare module "@tscircuit/props" {
  interface ChipPropsSU<PinLabel extends string = string> {
    /**
     * When true, show all pin aliases concatenated on schematic pins rather than only the last alias.
     */
    showPinAliases?: boolean
  }
}
