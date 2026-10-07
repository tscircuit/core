import { readFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { gunzipSync } from "node:zlib"
import type {
  AnyCircuitElement,
  CadComponent,
  CircuitJson,
  PcbBoard,
  PcbComponent,
  Point3,
} from "circuit-json"
import { getBestCameraPosition } from "circuit-json-to-gltf"
import type { ReactElement } from "react"
import {
  applyToPoint,
  compose,
  flipY,
  identity,
  inverse,
  rotateDEG,
} from "transformation-matrix"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>

interface LoadedCadModelFixture {
  cadLocalPosition: Point3
  embeddedStepModelUrl: string
  cadRotationOffset: Point3
  importedCadComponent: CadComponent
  pcbComponent: PcbComponent
  sourceComponent: SourceComponent
}

type EmbeddedModelIndex = number

export interface TiEvmCadPlacementRepro {
  cadModelIndex: EmbeddedModelIndex
  fixtureName: string
  name: string
}

export interface LoadedTiEvmCadPlacementRepro {
  circuitElement: ReactElement
  getTargetRenderedCadComponent: (params: {
    renderedCircuitJson: CircuitJson
  }) => CadComponent
  getVisualSnapshot: (params: { renderedCircuitJson: CircuitJson }) => {
    bottomCamera: ReturnType<typeof getBestCameraPosition>
    circuitJson: CircuitJson
    topCamera: ReturnType<typeof getBestCameraPosition>
  }
}

const getEmbeddedModelIndex = (
  cadComponent: CadComponent,
): EmbeddedModelIndex => {
  const modelUrl =
    cadComponent.model_step_url ??
    cadComponent.model_glb_url ??
    cadComponent.model_stl_url
  const modelFileName = modelUrl ? basename(modelUrl) : undefined
  const modelIndex = modelFileName?.match(/^(?<index>\d+)\.(?:glb|step|stl)$/u)
    ?.groups?.index
  if (!modelIndex) {
    throw new Error(
      `${cadComponent.cad_component_id} has no indexed embedded CAD model URL`,
    )
  }
  return Number(modelIndex)
}

const getPcbComponentOrThrow = ({
  cadComponent,
  circuitJson,
}: {
  cadComponent: CadComponent
  circuitJson: CircuitJson
}): PcbComponent => {
  const pcbComponent = circuitJson.find(
    (element): element is PcbComponent =>
      element.type === "pcb_component" &&
      element.pcb_component_id === cadComponent.pcb_component_id,
  )
  if (!pcbComponent) throw new Error("CAD model has no PCB component")
  return pcbComponent
}

const getSourceComponentOrThrow = ({
  circuitJson,
  pcbComponent,
}: {
  circuitJson: CircuitJson
  pcbComponent: PcbComponent
}): SourceComponent => {
  const sourceComponent = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" &&
      element.source_component_id === pcbComponent.source_component_id,
  )
  if (!sourceComponent) throw new Error("PCB component has no source component")
  return sourceComponent
}

/**
 * Converts an imported board-world CAD placement into Core's component-local
 * PCB frame. Both frames are right-handed millimetre frames with +X right,
 * +Y top, and +Z above the board. The XY value is a point and therefore uses
 * the component translation; the rotation is a direction and does not.
 */
const getCadModelLocalPlacement = ({
  cadComponent,
  pcbBoard,
  pcbComponent,
}: {
  cadComponent: CadComponent
  pcbBoard: PcbBoard
  pcbComponent: PcbComponent
}): { position: Point3; rotation: Point3 } => {
  const layer = cadComponent.layer ?? pcbComponent.layer
  const importedRotation = cadComponent.rotation ?? { x: 0, y: 0, z: 0 }
  const componentLocalPosition = applyToPoint(
    inverse(
      compose(
        rotateDEG(pcbComponent.rotation),
        layer === "bottom" ? flipY() : identity(),
      ),
    ),
    {
      x: cadComponent.position.x - pcbComponent.center.x,
      y: cadComponent.position.y - pcbComponent.center.y,
    },
  )

  return {
    position: {
      x: componentLocalPosition.x,
      y: componentLocalPosition.y,
      z:
        layer === "bottom"
          ? cadComponent.position.z + pcbBoard.thickness / 2
          : cadComponent.position.z - pcbBoard.thickness / 2,
    },
    rotation:
      layer === "bottom"
        ? {
            x: importedRotation.x,
            y: importedRotation.y - 180,
            z: importedRotation.z + pcbComponent.rotation,
          }
        : {
            x: importedRotation.x,
            y: importedRotation.y,
            z: importedRotation.z - pcbComponent.rotation,
          },
  }
}

const loadCadModelFixture = async ({
  cadComponent,
  circuitJson,
  fixtureName,
  pcbBoard,
}: {
  cadComponent: CadComponent
  circuitJson: CircuitJson
  fixtureName: string
  pcbBoard: PcbBoard
}): Promise<LoadedCadModelFixture> => {
  const pcbComponent = getPcbComponentOrThrow({ cadComponent, circuitJson })
  const sourceComponent = getSourceComponentOrThrow({
    circuitJson,
    pcbComponent,
  })
  const embeddedModelIndex = getEmbeddedModelIndex(cadComponent)
  const compressedCadModel = await readFile(
    join(
      import.meta.dir,
      "fixtures",
      "cad-models",
      fixtureName,
      `${embeddedModelIndex}.step.gz`,
    ),
  )
  const localPlacement = getCadModelLocalPlacement({
    cadComponent,
    pcbBoard,
    pcbComponent,
  })

  return {
    cadLocalPosition: localPlacement.position,
    embeddedStepModelUrl: `data:application/step;base64,${gunzipSync(compressedCadModel).toString("base64")}`,
    cadRotationOffset: localPlacement.rotation,
    importedCadComponent: cadComponent,
    pcbComponent,
    sourceComponent,
  }
}

const getModelOriginPosition = (
  cadComponent: CadComponent,
): Point3 | undefined =>
  cadComponent.model_origin_position ??
  (cadComponent.model_origin_alignment === "unknown"
    ? { x: 0, y: 0, z: 0 }
    : undefined)

function getRenderedCadModelFixtureOrThrow({
  cadModelFixtures,
  renderedCadComponent,
  renderedCircuitJson,
}: {
  cadModelFixtures: LoadedCadModelFixture[]
  renderedCadComponent: CadComponent
  renderedCircuitJson: CircuitJson
}): LoadedCadModelFixture {
  const renderedPcbComponent = getPcbComponentOrThrow({
    cadComponent: renderedCadComponent,
    circuitJson: renderedCircuitJson,
  })
  const renderedSourceComponent = getSourceComponentOrThrow({
    circuitJson: renderedCircuitJson,
    pcbComponent: renderedPcbComponent,
  })
  const cadModelFixture = cadModelFixtures.find(
    (candidate) =>
      candidate.sourceComponent.name === renderedSourceComponent.name,
  )
  if (!cadModelFixture) {
    throw new Error(
      `${renderedSourceComponent.name} has no imported CAD fixture`,
    )
  }
  return cadModelFixture
}

/**
 * The JSX uses Core's right-handed component-local PCB frame in millimetres.
 * The visual result translates every emitted CAD point into the untouched
 * Altium board-world frame, also right-handed millimetres, for inspection.
 */
export async function createTiEvmCadPlacementRepro(
  repro: TiEvmCadPlacementRepro,
): Promise<LoadedTiEvmCadPlacementRepro> {
  const compressedCircuitJson = await readFile(
    join(
      import.meta.dir,
      "fixtures",
      "circuit-json",
      `${repro.fixtureName}-cad.circuit.json.gz`,
    ),
  )
  const circuitJson = JSON.parse(
    gunzipSync(compressedCircuitJson).toString("utf8"),
  ) as CircuitJson
  const pcbBoard = circuitJson.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  if (!pcbBoard) throw new Error(`${repro.fixtureName} has no PCB board`)
  const importedCadComponents = circuitJson.filter(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      (element.model_step_url !== undefined ||
        element.model_glb_url !== undefined ||
        element.model_stl_url !== undefined),
  )
  const cadModelFixtures = await Promise.all(
    importedCadComponents.map((cadComponent) =>
      loadCadModelFixture({
        cadComponent,
        circuitJson,
        fixtureName: repro.fixtureName,
        pcbBoard,
      }),
    ),
  )
  const targetCadModelFixture = cadModelFixtures.find(
    (cadModelFixture) =>
      cadModelFixture.sourceComponent.name === repro.name &&
      getEmbeddedModelIndex(cadModelFixture.importedCadComponent) ===
        repro.cadModelIndex,
  )
  if (!targetCadModelFixture) {
    throw new Error(`${repro.name} has no CAD model ${repro.cadModelIndex}`)
  }

  return {
    circuitElement: (
      <board
        width={pcbBoard.width}
        height={pcbBoard.height}
        thickness={pcbBoard.thickness}
      >
        {cadModelFixtures.map((cadModelFixture) => (
          <chip
            key={cadModelFixture.sourceComponent.name}
            name={cadModelFixture.sourceComponent.name}
            pcbX={cadModelFixture.pcbComponent.center.x - pcbBoard.center.x}
            pcbY={cadModelFixture.pcbComponent.center.y - pcbBoard.center.y}
            pcbRotation={`${cadModelFixture.pcbComponent.rotation}deg`}
            layer={cadModelFixture.pcbComponent.layer}
            footprint={
              <footprint>
                <smtpad width={0.01} height={0.01} shape="rect" />
              </footprint>
            }
            cadModel={
              <cadmodel
                modelUrl={`${cadModelFixture.embeddedStepModelUrl}#ext=step`}
                positionOffset={cadModelFixture.cadLocalPosition}
                rotationOffset={cadModelFixture.cadRotationOffset}
                modelUnitToMmScale={
                  cadModelFixture.importedCadComponent
                    .model_unit_to_mm_scale_factor
                }
                modelBoardNormalDirection={
                  cadModelFixture.importedCadComponent
                    .model_board_normal_direction
                }
                modelOriginPosition={getModelOriginPosition(
                  cadModelFixture.importedCadComponent,
                )}
                size={cadModelFixture.importedCadComponent.size}
              />
            }
          />
        ))}
      </board>
    ),
    getTargetRenderedCadComponent: ({ renderedCircuitJson }) => {
      const renderedCadComponent = renderedCircuitJson
        .filter(
          (element): element is CadComponent =>
            element.type === "cad_component",
        )
        .find(
          (candidate) =>
            getRenderedCadModelFixtureOrThrow({
              cadModelFixtures,
              renderedCadComponent: candidate,
              renderedCircuitJson,
            }) === targetCadModelFixture,
        )
      if (!renderedCadComponent) {
        throw new Error(`${repro.name} did not render its CAD model`)
      }
      return renderedCadComponent
    },
    getVisualSnapshot: ({ renderedCircuitJson }) => {
      const circuitJsonWithoutCadModels = circuitJson.filter(
        (element) => element.type !== "cad_component",
      )
      const positionedCadComponents = renderedCircuitJson
        .filter(
          (element): element is CadComponent =>
            element.type === "cad_component",
        )
        .map((renderedCadComponent): CadComponent => {
          const cadModelFixture = getRenderedCadModelFixtureOrThrow({
            cadModelFixtures,
            renderedCadComponent,
            renderedCircuitJson,
          })
          return {
            ...cadModelFixture.importedCadComponent,
            position: {
              x: renderedCadComponent.position.x + pcbBoard.center.x,
              y: renderedCadComponent.position.y + pcbBoard.center.y,
              z: renderedCadComponent.position.z,
            },
            rotation:
              renderedCadComponent.rotation ??
              cadModelFixture.importedCadComponent.rotation,
            layer: renderedCadComponent.layer,
            model_glb_url: undefined,
            model_step_url: cadModelFixture.embeddedStepModelUrl,
            model_stl_url: undefined,
          }
        })
      const visualCircuitJson = [
        ...circuitJsonWithoutCadModels,
        ...positionedCadComponents,
      ]
      return {
        bottomCamera: getBestCameraPosition([pcbBoard], {
          aspectRatio: 4 / 3,
          direction: [-0.7, -1.2, -0.8],
        }),
        circuitJson: visualCircuitJson,
        topCamera: getBestCameraPosition([pcbBoard], {
          aspectRatio: 4 / 3,
          direction: [-0.7, 1.2, -0.8],
        }),
      }
    },
  }
}
