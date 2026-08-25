import type { SimpleRouteBounds } from "lib/utils/autorouting/SimpleRouteJson"

export interface FanoutPhaseRegion {
  regionId?: string
  name: string
  bounds: SimpleRouteBounds
  boundaryKeepaway: number
}

export interface FanoutPhaseSeparationConflict {
  firstRegion: FanoutPhaseRegion
  secondRegion: FanoutPhaseRegion
  availableGap: number
  requiredGap: number
}

const getAxisGap = (
  firstMinimum: number,
  firstMaximum: number,
  secondMinimum: number,
  secondMaximum: number,
): number =>
  Math.max(secondMinimum - firstMaximum, firstMinimum - secondMaximum)

export const findFanoutPhaseSeparationConflict = (
  regions: readonly FanoutPhaseRegion[],
): FanoutPhaseSeparationConflict | undefined => {
  for (let firstIndex = 0; firstIndex < regions.length; firstIndex++) {
    const firstRegion = regions[firstIndex]!
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < regions.length;
      secondIndex++
    ) {
      const secondRegion = regions[secondIndex]!
      if (
        firstRegion.regionId &&
        firstRegion.regionId === secondRegion.regionId
      ) {
        continue
      }
      const horizontalGap = getAxisGap(
        firstRegion.bounds.minX,
        firstRegion.bounds.maxX,
        secondRegion.bounds.minX,
        secondRegion.bounds.maxX,
      )
      const verticalGap = getAxisGap(
        firstRegion.bounds.minY,
        firstRegion.bounds.maxY,
        secondRegion.bounds.minY,
        secondRegion.bounds.maxY,
      )
      const availableGap = Math.max(horizontalGap, verticalGap)
      const requiredGap =
        firstRegion.boundaryKeepaway + secondRegion.boundaryKeepaway
      if (availableGap + 1e-6 < requiredGap) {
        return {
          firstRegion,
          secondRegion,
          availableGap,
          requiredGap,
        }
      }
    }
  }
  return undefined
}
