from pathlib import Path
ar=Path('lib/autorouter-pipelines/AutoroutingPipeline9_PreloadedTraceGraph/Pipeline9HighDensitySolver.ts');s=ar.read_text()
needle='availableZ.has(segment.z) &&';assert s.count(needle)==1;s=s.replace(needle,'(availableZ.has(segment.z) || (!board.allowBlindAndBuriedVias && availableZ.size > 1)) &&')
needle='if (!availableZ.has(segment.z)) continue';assert s.count(needle)==1;s=s.replace(needle,'if (!availableZ.has(segment.z) && (board.allowBlindAndBuriedVias || availableZ.size < 2)) continue')
needle='traceThickness: segment.width,\n      route:';assert s.count(needle)==1;s=s.replace(needle,'traceThickness: segment.width,\n      viaOnly: !availableZ.has(segment.z),\n      route:');ar.write_text(s)
b01=Path('node_modules/@tscircuit/high-density-b01/lib/HighDensitySolverB01/HighDensitySolverB01.ts');s=b01.read_text()
needle='if (layer === undefined) {\n            return `Obstacle ${obstacleIndex} uses unavailable layer z=${segmentStart.z}`\n          }';assert needle in s;s=s.replace(needle,'if (layer === undefined && !obstacle.viaOnly) {\n            return `Obstacle ${obstacleIndex} uses unavailable layer z=${segmentStart.z}`\n          }')
needle='segmentEnd,\n            layer,\n            obstacleRootId,';assert needle in s;s=s.replace(needle,'segmentEnd,\n            layer: obstacle.viaOnly ? -1 : layer!,\n            obstacleRootId,')
needle='this.addObstacleRootId({\n          rootIdsByCell: this.obstacleTraceRootIdsFlat,';assert s.count(needle)>=1
# A via-only route still enters the existing primitive index and shared via raster.
needle='const gridSegmentStart = this.transformBoundsPointToGrid(';p=s.index(needle,s.index('private rasterizeObstacleTraceSegment'));q=s.index('this.forEachCellNearSegment(',p);e=s.index('\n\n    this.forEachCellNearSegment(',q+1)
s=s[:q]+'if (params.layer >= 0) {\n    '+s[q:e]+'\n    }'+s[e:];b01.write_text(s)
t=Path('node_modules/@tscircuit/high-density-b01/lib/obstacle-dataset-types.ts');s=t.read_text().replace('export type HighDensityRouteObstacle = {','export type HighDensityRouteObstacle = {\n  viaOnly?: boolean');t.write_text(s)
