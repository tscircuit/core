import { type StampboardProps, stampboardProps } from "@tscircuit/props"
import { Board } from "./Board"

export class Stampboard extends Board {
  get config() {
    return {
      componentName: "Stampboard",
      zodProps: stampboardProps,
    }
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    super.doInitialPcbComponentRender()

    const props = this._parsedProps as unknown as StampboardProps
  }
}
