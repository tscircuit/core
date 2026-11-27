import type {
  AssemblyDrawingExplosionViewProps,
  AssemblyDrawingStageProps,
  AssemblyDrawingPartLabelProps,
  AssemblyDrawingNoteProps,
  AssemblyDrawingDimensionProps,
  AssemblyDrawingPageProps,
  AssemblyDrawingPartViewProps,
  AssemblyDrawingTitleBlockProps,
  AssemblyDrawingHarnessViewProps,
  AssemblyDrawingWiringTableProps,
  AssemblyDrawingBomTableProps,
  AssemblyCableWireProps,
  AssemblyExplosionStagePropsInput,
  AssemblyExplosionMovePropsInput,
  AssemblyCablePropsInput,
  AssemblyBoltPropsInput,
  AssemblyDevicePropsInput,
  AssemblyMotorPropsInput,
  AssemblyPartPropsInput,
  AssemblyReferenceSurfacePropsInput,
  AssemblyPrintedPartPropsInput,
  AssemblyScreenPropsInput,
  AssemblyStickerPropsInput,
  AssemblySubassemblyPropsInput,
} from "@tscircuit/props"
import type { ReactNode } from "react"
import { createNamespacedElement } from "./create-namespaced-element"

export interface AssemblyDeviceJsxProps extends AssemblyDevicePropsInput {
  children?: ReactNode
}

export interface AssemblyScreenJsxProps extends AssemblyScreenPropsInput {}

export interface AssemblyMotorJsxProps extends AssemblyMotorPropsInput {}

export interface AssemblyPartJsxProps extends AssemblyPartPropsInput {}

export interface AssemblyPrintedPartJsxProps
  extends AssemblyPrintedPartPropsInput {
  children?: ReactNode
}

export interface AssemblySubassemblyJsxProps
  extends AssemblySubassemblyPropsInput {}
export type AssemblyCadAssemblyJsxProps = AssemblySubassemblyJsxProps

export interface AssemblyCableJsxProps extends AssemblyCablePropsInput {
  children?: ReactNode
}

export const assembly = {
  drawing: {
    explosionview: createNamespacedElement<AssemblyDrawingExplosionViewProps>(
      "assembly.drawing.explosionview",
    ),
    stage: createNamespacedElement<AssemblyDrawingStageProps>(
      "assembly.drawing.stage",
    ),
    partlabel: createNamespacedElement<AssemblyDrawingPartLabelProps>(
      "assembly.drawing.partlabel",
    ),
    note: createNamespacedElement<AssemblyDrawingNoteProps>(
      "assembly.drawing.note",
    ),

    dimension: createNamespacedElement<AssemblyDrawingDimensionProps>(
      "assembly.drawing.dimension",
    ),
    page: createNamespacedElement<AssemblyDrawingPageProps>(
      "assembly.drawing.page",
    ),
    partview: createNamespacedElement<AssemblyDrawingPartViewProps>(
      "assembly.drawing.partview",
    ),
    titleblock: createNamespacedElement<AssemblyDrawingTitleBlockProps>(
      "assembly.drawing.titleblock",
    ),
    harnessview: createNamespacedElement<AssemblyDrawingHarnessViewProps>(
      "assembly.drawing.harnessview",
    ),
    wiringtable: createNamespacedElement<AssemblyDrawingWiringTableProps>(
      "assembly.drawing.wiringtable",
    ),
    bomtable: createNamespacedElement<AssemblyDrawingBomTableProps>(
      "assembly.drawing.bomtable",
    ),
  },
  explosion: {
    stage: createNamespacedElement<AssemblyExplosionStagePropsInput>(
      "assembly.explosion.stage",
    ),
    move: createNamespacedElement<AssemblyExplosionMovePropsInput>(
      "assembly.explosion.move",
    ),
  },
  referencesurface: createNamespacedElement<AssemblyReferenceSurfacePropsInput>(
    "assembly.referencesurface",
  ),
  bolt: createNamespacedElement<AssemblyBoltPropsInput>("assembly.bolt"),
  part: createNamespacedElement<AssemblyPartJsxProps>("assembly.part"),
  cable: createNamespacedElement<AssemblyCableJsxProps>("assembly.cable"),
  cablewire:
    createNamespacedElement<AssemblyCableWireProps>("assembly.cablewire"),
  printedpart: createNamespacedElement<AssemblyPrintedPartJsxProps>(
    "assembly.printedpart",
  ),
  motor: createNamespacedElement<AssemblyMotorJsxProps>("assembly.motor"),
  subassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.subassembly",
  ),
  cadassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.cadassembly",
  ),
  device: createNamespacedElement<AssemblyDeviceJsxProps>("assembly.device"),
  screen: createNamespacedElement<AssemblyScreenJsxProps>("assembly.screen"),
  sticker:
    createNamespacedElement<AssemblyStickerPropsInput>("assembly.sticker"),
} as const
