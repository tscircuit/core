import { antennaProps } from "@tscircuit/props"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { FTYPE } from "lib/utils/constants"
import { getGeneratedAntennaGeometry } from "./get-generated-antenna-geometry"

export class Antenna extends NormalComponent<
  typeof antennaProps,
  "pin1" | "feed" | "pin2" | "ground" | "gnd" | "feed2"
> {
  get config() {
    return {
      componentName: "Antenna",
      zodProps: antennaProps,
      sourceFtype: FTYPE.simple_chip,
      shouldRenderAsSchematicBox: true,
    }
  }

  getRefDesPrefixes(): string[] {
    return ["ANT"]
  }

  initPorts(): void {
    const { antennaShape, pcbPath } = this._parsedProps
    const secondaryPortRole = pcbPath
      ? undefined
      : antennaShape === "2.4ghz_inverted_f" ||
          antennaShape === "2.4ghz_meandered_inverted_f"
        ? "ground"
        : antennaShape === "2.4ghz_folded_dipole"
          ? "feed2"
          : undefined

    super.initPorts({
      pinCount: secondaryPortRole ? 2 : 1,
      additionalAliases: {
        pin1: ["feed"],
        ...(secondaryPortRole === "ground"
          ? { pin2: ["ground", "gnd"] }
          : secondaryPortRole === "feed2"
            ? { pin2: ["feed2"] }
            : {}),
      },
    })
  }

  doInitialReactSubtreesRender(): void {
    super.doInitialReactSubtreesRender()

    const { antennaShape, pcbPath } = this._parsedProps
    if (!antennaShape) return

    const hasFootprint = this.children.some(
      (child) => child.componentName === "Footprint",
    )
    if (pcbPath && hasFootprint) return

    const geometry = pcbPath
      ? undefined
      : getGeneratedAntennaGeometry(antennaShape)

    const generatedFootprint = new Footprint({
      name: `${this.name}_generated_antenna`,
    })

    if (!hasFootprint) {
      generatedFootprint.add(
        new SmtPad({
          shape: "rect",
          width: 0.8,
          height: 0.8,
          pcbX: geometry?.feedPoint.x ?? 0,
          pcbY: geometry?.feedPoint.y ?? 0,
          layer: "top",
          portHints: ["pin1"],
          coveredWithSolderMask: true,
        }),
      )
    }

    if (geometry) {
      generatedFootprint.add(
        new PcbTrace({
          route: geometry.route.map((point) => ({
            route_type: "wire" as const,
            ...point,
            width: geometry.traceWidth,
            layer: "top" as const,
          })),
        }),
      )

      if (geometry.secondaryPort && !hasFootprint) {
        generatedFootprint.add(
          new SmtPad({
            shape: "rect",
            width: 0.8,
            height: 0.8,
            pcbX: geometry.secondaryPort.point.x,
            pcbY: geometry.secondaryPort.point.y,
            layer: "top",
            portHints: ["pin2"],
            coveredWithSolderMask: true,
          }),
        )
      }

      if (geometry.groundViaPoint) {
        generatedFootprint.add(
          new PcbVia({
            pcbX: geometry.groundViaPoint.x,
            pcbY: geometry.groundViaPoint.y,
            holeDiameter: 0.3,
            outerDiameter: 0.7,
            isTented: true,
            netIsAssignable: true,
          }),
        )
      }
    }

    this.add(generatedFootprint)
  }

  doInitialCreateTracesFromProps(): void {
    super.doInitialCreateTracesFromProps()

    const { pcbPath } = this._parsedProps
    if (!pcbPath) return

    this.add(
      new Trace({
        name: `${this.name}_pcb_path`,
        path: [`${this.getSubcircuitSelector()} > port.pin1`],
        pcbPath,
      }),
    )
  }
}
