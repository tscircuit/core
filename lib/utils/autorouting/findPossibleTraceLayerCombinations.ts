interface Hint {
  via?: boolean
  optional_via?: boolean
  layers?: Array<string>
}

const LAYER_SELECTION_PREFERENCE = ["top", "bottom", "inner1", "inner2"]

/**
 * ORDERING OF CANDIDATES: Example:
 * top    -> top    -> bottom -> bottom
 * bottom -> bottom -> top    -> top
 * top    -> bottom -> bottom -> top
 * bottom -> top    -> top    -> bottom
 */
interface CandidateTraceLayerCombination {
  layer_path: string[]
}

/**
 * Given a set of hints that contain layers or indication there should be a via,
 * this function returns all combinations of layers that could be traversed.
 *
 * EXAMPLE 1:
 *   INPUT:
 *   [top,bottom] -> unspecified -> unspecified/via -> [top, bottom]
 *   OUTPUT:
 *   top -> top -> bottom -> bottom
 *   bottom -> bottom -> top -> top *
 * EXAMPLE 2:
 *   INPUT:
 *   [top,bottom] -> unspecified -> unspecified/via -> unspecified/via -> [top, bottom]
 *   OUTPUT:
 *   top -> top -> bottom -> top -> top
 *   bottom -> bottom -> top-> bottom -> bottom
 *   bottom -> bottom -> inner-1 -> inner-1 -> bottom
 */
export const findPossibleTraceLayerCombinations = (
  hints: Hint[],
  layer_path: string[] = [],
): CandidateTraceLayerCombination[] => {
  const candidates: CandidateTraceLayerCombination[] = []
  if (layer_path.length === 0) {
    const starting_layers = hints[0].layers!
    for (const layer of starting_layers) {
      candidates.push(
        ...findPossibleTraceLayerCombinations(hints.slice(1), [layer]),
      )
    }
    return candidates
  }

  if (hints.length === 0) return []
  const current_hint = hints[0]
  const is_possibly_via = current_hint.via || current_hint.optional_via
  const last_layer = layer_path[layer_path.length - 1]

  if (hints.length === 1) {
    const last_hint = current_hint
    if (last_hint.layers && is_possibly_via) {
      return last_hint.layers.map((layer) => ({
        layer_path: [...layer_path, layer],
      }))
    }
    if (last_hint.layers?.includes(last_layer)) {
      return [{ layer_path: [...layer_path, last_layer] }]
    }
    return []
  }

  if (!is_possibly_via) {
    if (current_hint.layers) {
      if (!current_hint.layers.includes(last_layer)) {
        return []
      }
    }

    return findPossibleTraceLayerCombinations(
      hints.slice(1),
      layer_path.concat([last_layer]),
    )
  }

  const candidate_next_layers = (
    current_hint.optional_via
      ? LAYER_SELECTION_PREFERENCE
      : LAYER_SELECTION_PREFERENCE.filter((layer) => layer !== last_layer)
  ).filter(
    (layer) => !current_hint.layers || current_hint.layers?.includes(layer),
  )

  for (const candidate_next_layer of candidate_next_layers) {
    candidates.push(
      ...findPossibleTraceLayerCombinations(
        hints.slice(1),
        layer_path.concat(candidate_next_layer),
      ),
    )
  }

  return candidates
}
