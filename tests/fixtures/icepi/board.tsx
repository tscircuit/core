import source from "./native/icepi/source.json"
import {
  NativeFullBoard,
  type FullBoardSource,
} from "./native/native-full-board"

export default function Board({
  geometryOnly = false,
}: { geometryOnly?: boolean } = {}) {
  return (
    <NativeFullBoard
      source={source as FullBoardSource}
      geometryOnly={geometryOnly}
    />
  )
}
