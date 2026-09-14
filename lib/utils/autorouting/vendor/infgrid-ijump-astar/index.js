// Vendored from @tscircuit/infgrid-ijump-astar@0.0.35 (dist/index.js).
// The upstream repo (tscircuit/autorouting) is archived, so this self-contained
// build is kept here and fixes land in core. See vendor/README.md.
//
// Patch applied for tscircuit/core#3927 (tscircuit/autorouting#92): in
// MultilayerIjump.getNeighbors the "overcome" branch no longer pushes the
// mirrored "cross the goal axis" stop (see the comment inside the travelDirs3
// block). All other exports are byte-identical to the published package.
// Do not reformat this file (listed in biome.json files.ignore).
// algos/infinite-grid-ijump-astar/v2/lib/util.ts
var manDist = (a, b) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};
var dirFromAToB = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { dx: Math.sign(dx), dy: 0 };
  } else {
    return { dx: 0, dy: Math.sign(dy) };
  }
};
var distAlongDir = (A, B, dir) => {
  return Math.abs(A.x - B.x) * Math.abs(dir.dx) + Math.abs(A.y - B.y) * Math.abs(dir.dy);
};
var nodeName = (node, GRID_STEP = 0.1) => `${Math.round(node.x / GRID_STEP)},${Math.round(node.y / GRID_STEP)}`;

// algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar.ts
import Debug2 from "debug";

// module/lib/solver-utils/getObstaclesFromRoute.ts
var isCloseTo = (a, b) => Math.abs(a - b) < 1e-4;
var getObstaclesFromRoute = (route, source_trace_id, { viaDiameter = 0.5 } = {}) => {
  const obstacles = [];
  for (let i = 0; i < route.length - 1; i++) {
    const [start, end] = [route[i], route[i + 1]];
    const prev = i - 1 >= 0 ? route[i - 1] : null;
    const isHorz = isCloseTo(start.y, end.y);
    const isVert = isCloseTo(start.x, end.x);
    if (!isHorz && !isVert) {
      throw new Error(
        `getObstaclesFromTrace currently only supports horizontal and vertical traces (not diagonals) Conflicting trace: ${source_trace_id}, start: (${start.x}, ${start.y}), end: (${end.x}, ${end.y})`
      );
    }
    const obstacle = {
      type: "rect",
      layers: [start.layer],
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      },
      width: isHorz ? Math.abs(start.x - end.x) : 0.1,
      // TODO use route width
      height: isVert ? Math.abs(start.y - end.y) : 0.1,
      // TODO use route width
      connectedTo: [source_trace_id]
    };
    obstacles.push(obstacle);
    if (prev && prev.layer === start.layer && start.layer !== end.layer) {
      const via = {
        type: "rect",
        layers: [start.layer, end.layer],
        center: {
          x: start.x,
          y: start.y
        },
        connectedTo: [source_trace_id],
        width: viaDiameter,
        height: viaDiameter
      };
      obstacles.push(via);
    }
  }
  return obstacles;
};

// algos/infinite-grid-ijump-astar/v2/lib/ObstacleList.ts
var ObstacleList = class {
  obstacles;
  GRID_STEP = 0.1;
  constructor(obstacles) {
    this.obstacles = obstacles.map((obstacle) => ({
      ...obstacle,
      left: obstacle.center.x - obstacle.width / 2,
      right: obstacle.center.x + obstacle.width / 2,
      top: obstacle.center.y + obstacle.height / 2,
      bottom: obstacle.center.y - obstacle.height / 2
    }));
  }
  getObstacleAt(x, y, m) {
    m ??= this.GRID_STEP;
    for (const obstacle of this.obstacles) {
      const halfWidth = obstacle.width / 2 + m;
      const halfHeight = obstacle.height / 2 + m;
      if (x >= obstacle.center.x - halfWidth && x <= obstacle.center.x + halfWidth && y >= obstacle.center.y - halfHeight && y <= obstacle.center.y + halfHeight) {
        return obstacle;
      }
    }
    return null;
  }
  isObstacleAt(x, y, m) {
    return this.getObstacleAt(x, y, m) !== null;
  }
  getDirectionDistancesToNearestObstacle(x, y) {
    const { GRID_STEP } = this;
    const result = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity
    };
    for (const obstacle of this.obstacles) {
      if (obstacle.type === "rect") {
        const left = obstacle.center.x - obstacle.width / 2 - GRID_STEP;
        const right = obstacle.center.x + obstacle.width / 2 + GRID_STEP;
        const top = obstacle.center.y + obstacle.height / 2 + GRID_STEP;
        const bottom = obstacle.center.y - obstacle.height / 2 - GRID_STEP;
        if (y >= bottom && y <= top && x > left) {
          result.left = Math.min(result.left, x - right);
        }
        if (y >= bottom && y <= top && x < right) {
          result.right = Math.min(result.right, left - x);
        }
        if (x >= left && x <= right && y < top) {
          result.top = Math.min(result.top, bottom - y);
        }
        if (x >= left && x <= right && y > bottom) {
          result.bottom = Math.min(result.bottom, y - top);
        }
      }
    }
    return result;
  }
  getOrthoDirectionCollisionInfo(point, dir, { margin = 0 } = {}) {
    const { x, y } = point;
    const { dx, dy } = dir;
    let minDistance = Infinity;
    let collisionObstacle = null;
    for (const obstacle of this.obstacles) {
      const leftMargin = obstacle.left - margin;
      const rightMargin = obstacle.right + margin;
      const topMargin = obstacle.top + margin;
      const bottomMargin = obstacle.bottom - margin;
      let distance = null;
      if (dx === 1 && dy === 0) {
        if (y > bottomMargin && y < topMargin && x < obstacle.left) {
          distance = obstacle.left - x;
        }
      } else if (dx === -1 && dy === 0) {
        if (y > bottomMargin && y < topMargin && x > obstacle.right) {
          distance = x - obstacle.right;
        }
      } else if (dx === 0 && dy === 1) {
        if (x > leftMargin && x < rightMargin && y < obstacle.bottom) {
          distance = obstacle.bottom - y;
        }
      } else if (dx === 0 && dy === -1) {
        if (x > leftMargin && x < rightMargin && y > obstacle.top) {
          distance = y - obstacle.top;
        }
      }
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        collisionObstacle = obstacle;
      }
    }
    return {
      dx,
      dy,
      wallDistance: minDistance,
      obstacle: collisionObstacle
    };
  }
  getObstaclesOverlappingRegion(region) {
    const obstacles = [];
    for (const obstacle of this.obstacles) {
      const { left, right, top, bottom } = obstacle;
      if (left <= region.maxX && right >= region.minX && top <= region.maxY && bottom >= region.minY) {
        obstacles.push(obstacle);
      }
    }
    return obstacles;
  }
};

// module/lib/solver-postprocessing/remove-path-loops.ts
function removePathLoops(path) {
  if (path.length < 4) return path;
  const result = [{ ...path[0] }];
  let currentLayer = path[0].layer;
  for (let i = 1; i < path.length; i++) {
    const currentSegment = { start: path[i - 1], end: path[i] };
    const isVia = path[i].route_type === "via" || path[i - 1].route_type === "via";
    if (path[i].layer !== currentLayer || isVia) {
      result.push({ ...path[i] });
      currentLayer = path[i].layer;
      continue;
    }
    let intersectionFound = false;
    let intersectionPoint = null;
    let intersectionIndex = -1;
    for (let j = 0; j < result.length - 1; j++) {
      const previousSegment = { start: result[j], end: result[j + 1] };
      if (previousSegment.start.layer !== currentSegment.start.layer) {
        continue;
      }
      if (previousSegment.start.layer === currentSegment.start.layer) {
        const intersection = findIntersection(previousSegment, currentSegment);
        if (intersection) {
          intersectionFound = true;
          intersectionPoint = {
            ...intersection,
            layer: currentLayer
          };
          intersectionIndex = j;
          break;
        }
      }
    }
    if (intersectionFound && intersectionPoint) {
      result.splice(intersectionIndex + 1);
      result.push(intersectionPoint);
    }
    const lastPoint = result[result.length - 1];
    if (lastPoint.x !== path[i].x || lastPoint.y !== path[i].y) {
      result.push(path[i]);
    }
  }
  return result;
}
function findIntersection(segment1, segment2) {
  if (segment1.start.x === segment1.end.x && segment2.start.x === segment2.end.x || segment1.start.y === segment1.end.y && segment2.start.y === segment2.end.y) {
    return null;
  }
  let intersectionPoint;
  if (segment1.start.x === segment1.end.x) {
    const x = segment1.start.x;
    const y = segment2.start.y;
    intersectionPoint = { ...segment1.start, x, y };
  } else {
    const x = segment2.start.x;
    const y = segment1.start.y;
    intersectionPoint = { ...segment1.start, x, y };
  }
  if (isPointInSegment(intersectionPoint, segment1) && isPointInSegment(intersectionPoint, segment2)) {
    return intersectionPoint;
  }
  return null;
}
function isPointInSegment(point, segment) {
  return point.x >= Math.min(segment.start.x, segment.end.x) && point.x <= Math.max(segment.start.x, segment.end.x) && point.y >= Math.min(segment.start.y, segment.end.y) && point.y <= Math.max(segment.start.y, segment.end.y);
}

// module/lib/solver-postprocessing/add-vias-when-layer-changes.ts
function addViasWhenLayerChanges(route) {
  const newRoute = [route[0]];
  for (let i = 1; i < route.length - 1; i++) {
    const [prev, current2, next] = [route[i - 1], route[i], route[i + 1]];
    newRoute.push(current2);
    if (current2.route_type !== "wire" || prev.route_type !== "wire" || next.route_type !== "wire")
      continue;
    if (prev.layer === current2.layer && current2.layer !== next.layer) {
      newRoute.push({
        route_type: "via",
        from_layer: current2.layer,
        to_layer: next.layer,
        x: current2.x,
        y: current2.y
      });
    }
  }
  newRoute.push(route[route.length - 1]);
  return newRoute;
}

// algos/infinite-grid-ijump-astar/v2/lib/shortenPathWithShortcuts.ts
import "circuit-json";
import Debug from "debug";
var debug = Debug("autorouter:shortenPathWithShortcuts");
function shortenPathWithShortcuts(route, checkIfObstacleBetweenPoints) {
  if (route.length <= 2) {
    return route;
  }
  const shortened = [route[0]];
  for (let i = 1; i < route.length; i++) {
    const currentSegment = {
      start: shortened[shortened.length - 1],
      end: route[i]
    };
    let skipToIndex = -1;
    const currentSegmentIsVertical = currentSegment.start.x === currentSegment.end.x;
    const currentSegmentIsHorizontal = currentSegment.start.y === currentSegment.end.y;
    for (let j = i + 1; j < route.length; j++) {
      if (j <= skipToIndex) continue;
      const futureSegment = {
        start: route[j],
        end: route[j + 1]
      };
      if (!futureSegment.end) continue;
      const futureSegmentIsVertical = futureSegment.start.x === futureSegment.end.x;
      const futureSegmentIsHorizontal = futureSegment.start.y === futureSegment.end.y;
      const bothVertical = currentSegmentIsVertical && futureSegmentIsVertical;
      const bothHorizontal = currentSegmentIsHorizontal && futureSegmentIsHorizontal;
      if (bothHorizontal && bothVertical) continue;
      const segmentsAreParallel = bothVertical || bothHorizontal;
      if (!segmentsAreParallel) continue;
      let overlapping = false;
      const currentMinX = Math.min(currentSegment.start.x, currentSegment.end.x);
      const currentMaxX = Math.max(currentSegment.start.x, currentSegment.end.x);
      const futureMinX = Math.min(futureSegment.start.x, futureSegment.end.x);
      const futureMaxX = Math.max(futureSegment.start.x, futureSegment.end.x);
      const currentMinY = Math.min(currentSegment.start.y, currentSegment.end.y);
      const currentMaxY = Math.max(currentSegment.start.y, currentSegment.end.y);
      const futureMinY = Math.min(futureSegment.start.y, futureSegment.end.y);
      const futureMaxY = Math.max(futureSegment.start.y, futureSegment.end.y);
      if (bothHorizontal) {
        overlapping = currentMinX <= futureMaxX && currentMaxX >= futureMinX;
      } else if (bothVertical) {
        overlapping = currentMinY <= futureMaxY && currentMaxY >= futureMinY;
      }
      if (!overlapping) continue;
      const candidateShortcuts = [];
      const pointBeforeShortcut = shortened[shortened.length - 1];
      const pointAfterShortcut = route[j + 2];
      if (!pointAfterShortcut) continue;
      if (bothHorizontal && futureMinX < currentMaxX && pointAfterShortcut.x === futureMinX) {
        candidateShortcuts.push({
          x: futureMinX,
          y: currentSegment.start.y,
          layer: currentSegment.start.layer
        });
      }
      if (bothHorizontal && futureMaxX > currentMinX && pointAfterShortcut.x === futureMaxX) {
        candidateShortcuts.push({
          x: futureMaxX,
          y: currentSegment.start.y,
          layer: currentSegment.start.layer
        });
      }
      if (bothVertical && futureMinY < currentMaxY && pointAfterShortcut.y === futureMinY) {
        candidateShortcuts.push({
          x: currentSegment.start.x,
          y: futureMinY,
          layer: currentSegment.start.layer
        });
      }
      if (bothVertical && futureMaxY > currentMinY && pointAfterShortcut.y === futureMaxY) {
        candidateShortcuts.push({
          x: currentSegment.start.x,
          y: futureMaxY,
          layer: currentSegment.start.layer
        });
      }
      let shortcutPoint = null;
      for (const candidateShortcut of candidateShortcuts) {
        if (checkIfObstacleBetweenPoints(
          pointBeforeShortcut,
          candidateShortcut
        ) || checkIfObstacleBetweenPoints(pointAfterShortcut, candidateShortcut)) {
          continue;
        }
        shortcutPoint = candidateShortcut;
        break;
      }
      if (!shortcutPoint) continue;
      shortened.push(shortcutPoint);
      i = j + 1;
      skipToIndex = j + 1;
      break;
    }
    if (skipToIndex === -1) {
      shortened.push(route[i]);
    }
  }
  if (shortened[shortened.length - 1] !== route[route.length - 1]) {
    shortened.push(route[route.length - 1]);
  }
  return shortened;
}

// algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar.ts
var debug2 = Debug2("autorouting-dataset:astar");
var GeneralizedAstarAutorouter = class {
  openSet = [];
  closedSet = /* @__PURE__ */ new Set();
  debug = false;
  debugSolutions;
  debugMessage = null;
  debugTraceCount = 0;
  input;
  obstacles;
  allObstacles;
  startNode;
  goalPoint;
  GRID_STEP;
  OBSTACLE_MARGIN;
  MAX_ITERATIONS;
  isRemovePathLoopsEnabled;
  isShortenPathWithShortcutsEnabled;
  /**
   * Setting this greater than 1 makes the algorithm find suboptimal paths and
   * act more greedy, but at greatly improves performance.
   *
   * Recommended value is between 1.1 and 1.5
   */
  GREEDY_MULTIPLIER = 1.1;
  iterations = -1;
  constructor(opts) {
    this.input = opts.input;
    this.allObstacles = opts.input.obstacles;
    this.startNode = opts.startNode;
    this.goalPoint = opts.goalPoint ? { l: 0, ...opts.goalPoint } : void 0;
    this.GRID_STEP = opts.GRID_STEP ?? 0.1;
    this.OBSTACLE_MARGIN = opts.OBSTACLE_MARGIN ?? 0.15;
    this.MAX_ITERATIONS = opts.MAX_ITERATIONS ?? 100;
    this.debug = opts.debug ?? debug2.enabled;
    this.isRemovePathLoopsEnabled = opts.isRemovePathLoopsEnabled ?? false;
    this.isShortenPathWithShortcutsEnabled = opts.isShortenPathWithShortcutsEnabled ?? false;
    if (this.debug) {
      debug2.enabled = true;
    }
    if (debug2.enabled) {
      this.debugSolutions = {};
      this.debugMessage = "";
    }
  }
  /**
   * Return points of interest for this node. Don't worry about checking if
   * points are already visited. You must check that these neighbors are valid
   * (not inside an obstacle)
   *
   * In a simple grid, this is just the 4 neighbors surrounding the node.
   *
   * In ijump-astar, this is the 2-4 surrounding intersections
   */
  getNeighbors(node) {
    return [];
  }
  isSameNode(a, b) {
    return manDist(a, b) < this.GRID_STEP;
  }
  /**
   * Compute the cost of this path. In normal astar, this is just the length of
   * the path, but you can override this term to penalize paths that are more
   * complex.
   */
  computeG(current2, neighbor) {
    return current2.g + manDist(current2, neighbor);
  }
  computeH(node) {
    return manDist(node, this.goalPoint);
  }
  getNodeName(node) {
    return nodeName(node, this.GRID_STEP);
  }
  solveOneStep() {
    this.iterations += 1;
    const { openSet, closedSet, GRID_STEP, goalPoint } = this;
    openSet.sort((a, b) => a.f - b.f);
    const current2 = openSet.shift();
    const goalDist = this.computeH(current2);
    if (goalDist <= GRID_STEP * 2) {
      return {
        solved: true,
        current: current2,
        newNeighbors: []
      };
    }
    this.closedSet.add(this.getNodeName(current2));
    let newNeighbors = [];
    for (const neighbor of this.getNeighbors(current2)) {
      if (closedSet.has(this.getNodeName(neighbor))) continue;
      const tentativeG = this.computeG(current2, neighbor);
      const existingNeighbor = this.openSet.find(
        (n) => this.isSameNode(n, neighbor)
      );
      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        const h = this.computeH(neighbor);
        const f = tentativeG + h * this.GREEDY_MULTIPLIER;
        const neighborNode = {
          ...neighbor,
          g: tentativeG,
          h,
          f,
          obstacleHit: neighbor.obstacleHit ?? void 0,
          manDistFromParent: manDist(current2, neighbor),
          // redundant compute...
          nodesInPath: current2.nodesInPath + 1,
          parent: current2,
          enterMarginCost: neighbor.enterMarginCost,
          travelMarginCostFactor: neighbor.travelMarginCostFactor
        };
        openSet.push(neighborNode);
        newNeighbors.push(neighborNode);
      }
    }
    if (debug2.enabled) {
      openSet.sort((a, b) => a.f - b.f);
      this.drawDebugSolution({ current: current2, newNeighbors });
    }
    return {
      solved: false,
      current: current2,
      newNeighbors
    };
  }
  getStartNode(connection) {
    return {
      x: connection.pointsToConnect[0].x,
      y: connection.pointsToConnect[0].y,
      manDistFromParent: 0,
      f: 0,
      g: 0,
      h: 0,
      nodesInPath: 0,
      parent: null
    };
  }
  layerToIndex(layer) {
    return 0;
  }
  indexToLayer(index) {
    return "top";
  }
  /**
   * Add a preprocessing step before solving a connection to do adjust points
   * based on previous iterations. For example, if a previous connection solved
   * for a trace on the same net, you may want to preprocess the connection to
   * solve for an easier start and end point
   *
   * The simplest way to do this is to run getConnectionWithAlternativeGoalBoxes
   * with any pcb_traces created by previous iterations
   */
  preprocessConnectionBeforeSolving(connection) {
    return connection;
  }
  solveConnection(connection) {
    if (connection.pointsToConnect.length > 2) {
      throw new Error(
        "GeneralizedAstarAutorouter doesn't currently support 2+ points in a connection"
      );
    }
    connection = this.preprocessConnectionBeforeSolving(connection);
    const { pointsToConnect } = connection;
    this.iterations = 0;
    this.closedSet = /* @__PURE__ */ new Set();
    this.startNode = this.getStartNode(connection);
    this.goalPoint = {
      ...pointsToConnect[pointsToConnect.length - 1],
      l: this.layerToIndex(pointsToConnect[pointsToConnect.length - 1].layer)
    };
    this.openSet = [this.startNode];
    while (this.iterations < this.MAX_ITERATIONS) {
      const { solved, current: current2 } = this.solveOneStep();
      if (solved) {
        let route = [];
        let node = current2;
        while (node) {
          const l = node.l;
          route.unshift({
            x: node.x,
            y: node.y,
            // TODO: this layer should be included as part of the node
            layer: l !== void 0 ? this.indexToLayer(l) : pointsToConnect[0].layer
          });
          node = node.parent;
        }
        if (debug2.enabled) {
          this.debugMessage += `t${this.debugTraceCount}: ${this.iterations} iterations
`;
        }
        if (this.isRemovePathLoopsEnabled) {
          route = removePathLoops(route);
        }
        if (this.isShortenPathWithShortcutsEnabled) {
          route = shortenPathWithShortcuts(route, (A, B) => {
            if (A.x === B.x && A.y === B.y) return false;
            const collision = this.obstacles.getOrthoDirectionCollisionInfo(
              {
                x: A.x,
                y: A.y,
                l: this.layerToIndex(A.layer) ?? 0
              },
              {
                dx: Math.sign(B.x - A.x),
                dy: Math.sign(B.y - A.y),
                dl: 0
              },
              {
                margin: 0.05
              }
            );
            const dist3 = Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2);
            return collision.wallDistance < dist3;
          });
        }
        return { solved: true, route, connectionName: connection.name };
      }
      if (this.openSet.length === 0) {
        break;
      }
    }
    if (debug2.enabled) {
      this.debugMessage += `t${this.debugTraceCount}: ${this.iterations} iterations (failed)
`;
    }
    return { solved: false, connectionName: connection.name };
  }
  createObstacleList({
    dominantLayer,
    connection,
    obstaclesFromTraces
  }) {
    return new ObstacleList(
      this.allObstacles.filter((obstacle) => !obstacle.connectedTo.includes(connection.name)).filter((obstacle) => obstacle.layers.includes(dominantLayer)).concat(obstaclesFromTraces ?? [])
    );
  }
  /**
   * Override this to implement smoothing strategies or incorporate new traces
   * into a connectivity map
   */
  postprocessConnectionSolveResult(connection, result) {
    return result;
  }
  /**
   * By default, this will solve the connections in the order they are given,
   * and add obstacles for each successfully solved connection. Override this
   * to implement "rip and replace" rerouting strategies.
   */
  solve() {
    const solutions = [];
    const obstaclesFromTraces = [];
    this.debugTraceCount = 0;
    for (const connection of this.input.connections) {
      const dominantLayer = connection.pointsToConnect[0].layer ?? "top";
      this.debugTraceCount += 1;
      this.obstacles = this.createObstacleList({
        dominantLayer,
        connection,
        obstaclesFromTraces
      });
      let result = this.solveConnection(connection);
      result = this.postprocessConnectionSolveResult(connection, result);
      solutions.push(result);
      if (debug2.enabled) {
        this.drawDebugTraceObstacles(obstaclesFromTraces);
      }
      if (result.solved) {
        obstaclesFromTraces.push(
          ...getObstaclesFromRoute(
            result.route.map((p) => ({
              x: p.x,
              y: p.y,
              layer: p.layer ?? dominantLayer
            })),
            connection.name
          )
        );
      }
    }
    return solutions;
  }
  solveAndMapToTraces() {
    const solutions = this.solve();
    return solutions.flatMap((solution) => {
      if (!solution.solved) return [];
      return [
        {
          type: "pcb_trace",
          pcb_trace_id: `pcb_trace_for_${solution.connectionName}`,
          route: addViasWhenLayerChanges(
            solution.route.map((point) => ({
              route_type: "wire",
              x: point.x,
              y: point.y,
              width: this.input.minTraceWidth,
              layer: point.layer
            }))
          )
        }
      ];
    });
  }
  getDebugGroup() {
    const dgn = `t${this.debugTraceCount}_iter[${this.iterations - 1}]`;
    if (this.iterations < 30) return dgn;
    if (this.iterations < 100 && this.iterations % 10 === 0) return dgn;
    if (this.iterations < 1e3 && this.iterations % 100 === 0) return dgn;
    if (!this.debugSolutions) return dgn;
    return null;
  }
  drawDebugTraceObstacles(obstacles) {
    const { debugTraceCount, debugSolutions } = this;
    for (const key in debugSolutions) {
      if (key.startsWith(`t${debugTraceCount}_`)) {
        debugSolutions[key].push(
          ...obstacles.map(
            (obstacle, i) => ({
              type: "pcb_smtpad",
              pcb_component_id: "",
              layer: obstacle.layers[0],
              width: obstacle.width,
              shape: "rect",
              x: obstacle.center.x,
              y: obstacle.center.y,
              pcb_smtpad_id: `trace_obstacle_${i}`,
              height: obstacle.height
            })
          )
        );
      }
    }
  }
  drawDebugSolution({
    current: current2,
    newNeighbors
  }) {
    const debugGroup = this.getDebugGroup();
    if (!debugGroup) return;
    const { openSet, debugTraceCount, debugSolutions } = this;
    debugSolutions[debugGroup] ??= [];
    const debugSolution = debugSolutions[debugGroup];
    debugSolution.push({
      type: "pcb_fabrication_note_text",
      pcb_fabrication_note_text_id: `debug_note_${current2.x}_${current2.y}`,
      font: "tscircuit2024",
      font_size: 0.25,
      text: "X" + (current2.l !== void 0 ? current2.l : ""),
      pcb_component_id: "",
      layer: "top",
      anchor_position: {
        x: current2.x,
        y: current2.y
      },
      anchor_alignment: "center"
    });
    for (let i = 0; i < openSet.length; i++) {
      const node = openSet[i];
      debugSolution.push({
        type: "pcb_fabrication_note_path",
        pcb_component_id: "",
        pcb_fabrication_note_path_id: `note_path_${node.x}_${node.y}`,
        layer: "top",
        route: [
          [0, 0.05],
          [0.05, 0],
          [0, -0.05],
          [-0.05, 0],
          [0, 0.05]
        ].map(([dx, dy]) => ({
          x: node.x + dx,
          y: node.y + dy
        })),
        stroke_width: 0.01
      });
      debugSolution.push({
        type: "pcb_fabrication_note_text",
        pcb_fabrication_note_text_id: `debug_note_${node.x}_${node.y}`,
        font: "tscircuit2024",
        font_size: 0.03,
        text: i.toString(),
        pcb_component_id: "",
        layer: "top",
        anchor_position: {
          x: node.x,
          y: node.y
        },
        anchor_alignment: "center"
      });
    }
    if (current2.parent) {
      const path = [];
      let p = current2;
      while (p) {
        path.unshift(p);
        p = p.parent;
      }
      debugSolution.push({
        type: "pcb_fabrication_note_path",
        pcb_component_id: "",
        pcb_fabrication_note_path_id: `note_path_${current2.x}_${current2.y}`,
        layer: "top",
        route: path,
        stroke_width: 0.01
      });
    }
  }
};

// algos/infinite-grid-ijump-astar/v2/lib/getDistanceToOvercomeObstacle.ts
import Debug3 from "debug";
var debug3 = Debug3(
  "autorouting-dataset:infinite-grid-ijump-astar:get-distance-to-overcome-obstacle"
);
function getDistanceToOvercomeObstacle({
  node,
  travelDir,
  wallDir,
  obstacle,
  obstacles,
  obstaclesInRow = 0,
  OBSTACLE_MARGIN = 0.15,
  SHOULD_DETECT_CONJOINED_OBSTACLES = false,
  MAX_CONJOINED_OBSTACLES = 20
}) {
  let distToOvercomeObstacle;
  if (travelDir.dx === 0) {
    if (travelDir.dy > 0) {
      distToOvercomeObstacle = obstacle.center.y + obstacle.height / 2 - node.y;
    } else {
      distToOvercomeObstacle = node.y - (obstacle.center.y - obstacle.height / 2);
    }
  } else {
    if (travelDir.dx > 0) {
      distToOvercomeObstacle = obstacle.center.x + obstacle.width / 2 - node.x;
    } else {
      distToOvercomeObstacle = node.x - (obstacle.center.x - obstacle.width / 2);
    }
  }
  distToOvercomeObstacle += OBSTACLE_MARGIN;
  if (SHOULD_DETECT_CONJOINED_OBSTACLES && obstaclesInRow < MAX_CONJOINED_OBSTACLES) {
    const obstacleAtEnd = obstacles.getObstacleAt(
      node.x + travelDir.dx * distToOvercomeObstacle + wallDir.dx * (wallDir.wallDistance + 1e-3),
      node.y + travelDir.dy * distToOvercomeObstacle + wallDir.dy * (wallDir.wallDistance + 1e-3)
    );
    if (obstacleAtEnd === obstacle) {
      return distToOvercomeObstacle;
      throw new Error(
        "obstacleAtEnd === obstacle, we're bad at computing overcoming distance because it didn't overcome the obstacle"
      );
    }
    if (obstacleAtEnd && obstacleAtEnd.type === "rect") {
      const extendingAlongXAxis = travelDir.dy === 0;
      const o1OrthoDim = extendingAlongXAxis ? obstacle.height : obstacle.width;
      const o2OrthoDim = extendingAlongXAxis ? obstacleAtEnd.height : obstacleAtEnd.width;
      if (o2OrthoDim > o1OrthoDim) {
        debug3("next obstacle on path is bigger, not trying to overcome it");
        return distToOvercomeObstacle;
      }
      const endObstacleDistToOvercome = getDistanceToOvercomeObstacle({
        node: {
          x: node.x + travelDir.dx * distToOvercomeObstacle,
          y: node.y + travelDir.dy * distToOvercomeObstacle
        },
        travelDir,
        wallDir,
        obstacle: obstacleAtEnd,
        obstacles,
        obstaclesInRow: obstaclesInRow + 1,
        SHOULD_DETECT_CONJOINED_OBSTACLES,
        MAX_CONJOINED_OBSTACLES,
        OBSTACLE_MARGIN
      });
      distToOvercomeObstacle += endObstacleDistToOvercome;
    }
  }
  return distToOvercomeObstacle;
}

// algos/infinite-grid-ijump-astar/v2/lib/IJumpAutorouter.ts
var IJumpAutorouter = class extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS = 200;
  getNeighbors(node) {
    const obstacles = this.obstacles;
    const goalPoint = this.goalPoint;
    let forwardDir;
    if (!node.parent) {
      forwardDir = dirFromAToB(node, goalPoint);
    } else {
      forwardDir = dirFromAToB(node.parent, node);
    }
    const travelDirs1 = [
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 }
    ].filter((dir) => {
      if (dir.dx === forwardDir.dx * -1 && dir.dy === forwardDir.dy * -1) {
        return false;
      } else if (dir.dx === forwardDir.dx && dir.dy === forwardDir.dy && node.parent?.obstacleHit) {
        return false;
      }
      return true;
    }).map(
      (dir) => obstacles.getOrthoDirectionCollisionInfo(node, dir, {
        margin: this.OBSTACLE_MARGIN
      })
    ).filter((dir) => dir.wallDistance >= this.OBSTACLE_MARGIN);
    const travelDirs2 = [];
    for (const travelDir of travelDirs1) {
      let overcomeDistance = null;
      if (node?.obstacleHit) {
        overcomeDistance = getDistanceToOvercomeObstacle({
          node,
          travelDir,
          wallDir: { ...forwardDir, wallDistance: this.OBSTACLE_MARGIN },
          obstacle: node.obstacleHit,
          obstacles,
          OBSTACLE_MARGIN: this.OBSTACLE_MARGIN,
          SHOULD_DETECT_CONJOINED_OBSTACLES: true
        });
      }
      const goalDistAlongTravelDir = distAlongDir(node, goalPoint, travelDir);
      const isGoalInTravelDir = (travelDir.dx === 0 || Math.sign(goalPoint.x - node.x) === travelDir.dx) && (travelDir.dy === 0 || Math.sign(goalPoint.y - node.y) === travelDir.dy);
      if (goalDistAlongTravelDir < travelDir.wallDistance && goalDistAlongTravelDir > 0 && isGoalInTravelDir) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: goalDistAlongTravelDir
        });
      } else if (overcomeDistance !== null && overcomeDistance < travelDir.wallDistance) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: overcomeDistance
        });
      } else if (travelDir.wallDistance !== Infinity) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: travelDir.wallDistance - this.OBSTACLE_MARGIN
        });
      }
    }
    return travelDirs2.filter((dir) => {
      return !obstacles.isObstacleAt(
        node.x + dir.dx * dir.travelDistance,
        node.y + dir.dy * dir.travelDistance
      );
    }).map((dir) => ({
      x: node.x + dir.dx * dir.travelDistance,
      y: node.y + dir.dy * dir.travelDistance,
      obstacleHit: dir.obstacle
    }));
  }
};

// module/lib/solver-utils/getSimpleRouteJson.ts
import { su } from "@tscircuit/soup-util";

// module/lib/solver-utils/generateApproximatingRects.ts
function generateApproximatingRects(rotatedRect, numRects = 4) {
  const { center, width, height, rotation } = rotatedRect;
  const rects = [];
  const angleRad = rotation * Math.PI / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  const normalizedRotation = (rotation % 360 + 360) % 360;
  const sliceAlongWidth = height <= width ? normalizedRotation >= 45 && normalizedRotation < 135 || normalizedRotation >= 225 && normalizedRotation < 315 : normalizedRotation >= 135 && normalizedRotation < 225 || normalizedRotation >= 315 || normalizedRotation < 45;
  if (sliceAlongWidth) {
    const sliceWidth = width / numRects;
    for (let i = 0; i < numRects; i++) {
      const x = (i - numRects / 2 + 0.5) * sliceWidth;
      const rotatedX = -x * cosAngle;
      const rotatedY = -x * sinAngle;
      const coverageWidth = sliceWidth * 1.1;
      const coverageHeight = Math.abs(height * cosAngle) + Math.abs(sliceWidth * sinAngle);
      rects.push({
        center: {
          x: center.x + rotatedX,
          y: center.y + rotatedY
        },
        width: coverageWidth,
        height: coverageHeight
      });
    }
  } else {
    const sliceHeight = height / numRects;
    for (let i = 0; i < numRects; i++) {
      const y = (i - numRects / 2 + 0.5) * sliceHeight;
      const rotatedX = -y * sinAngle;
      const rotatedY = y * cosAngle;
      const coverageWidth = Math.abs(width * cosAngle) + Math.abs(sliceHeight * sinAngle);
      const coverageHeight = sliceHeight * 1.1;
      rects.push({
        center: {
          x: center.x + rotatedX,
          y: center.y + rotatedY
        },
        width: coverageWidth,
        height: coverageHeight
      });
    }
  }
  return rects;
}

// module/lib/solver-utils/getObstaclesFromCircuitJson.ts
var EVERY_LAYER = ["top", "inner1", "inner2", "bottom"];
var getObstaclesFromCircuitJson = (soup, connMap) => {
  const withNetId = (idList) => connMap ? idList.concat(
    idList.map((id) => connMap?.getNetConnectedToId(id)).filter(Boolean)
  ) : idList;
  const obstacles = [];
  for (const element of soup) {
    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: withNetId([element.pcb_smtpad_id])
        });
      } else if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          layers: [element.layer],
          center: {
            x: element.x,
            y: element.y
          },
          width: element.width,
          height: element.height,
          connectedTo: withNetId([element.pcb_smtpad_id])
        });
      } else if (element.shape === "rotated_rect") {
        const rotatedRect = {
          center: { x: element.x, y: element.y },
          width: element.width,
          height: element.height,
          rotation: element.ccw_rotation
        };
        const approximatingRects = generateApproximatingRects(rotatedRect);
        for (const rect of approximatingRects) {
          obstacles.push({
            type: "rect",
            layers: [element.layer],
            center: rect.center,
            width: rect.width,
            height: rect.height,
            connectedTo: withNetId([element.pcb_smtpad_id])
          });
        }
      }
    } else if (element.type === "pcb_keepout") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: element.layers,
          center: {
            x: element.center.x,
            y: element.center.y
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: []
        });
      } else if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          layers: element.layers,
          center: {
            x: element.center.x,
            y: element.center.y
          },
          width: element.width,
          height: element.height,
          connectedTo: []
        });
      }
    } else if (element.type === "pcb_hole") {
      if (element.hole_shape === "oval") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y
          },
          width: element.hole_width,
          height: element.hole_height,
          connectedTo: []
        });
      } else if (element.hole_shape === "square") {
        obstacles.push({
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y
          },
          width: element.hole_diameter,
          height: element.hole_diameter,
          connectedTo: []
        });
      } else if (
        // @ts-ignore
        element.hole_shape === "round" || element.hole_shape === "circle"
      ) {
        obstacles.push({
          type: "rect",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y
          },
          width: element.hole_diameter,
          height: element.hole_diameter,
          connectedTo: []
        });
      }
    } else if (element.type === "pcb_plated_hole") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y
          },
          width: element.outer_diameter,
          height: element.outer_diameter,
          connectedTo: withNetId([element.pcb_plated_hole_id])
        });
      } else if (element.shape === "oval" || element.shape === "pill") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          layers: EVERY_LAYER,
          center: {
            x: element.x,
            y: element.y
          },
          width: element.outer_width,
          height: element.outer_height,
          connectedTo: withNetId([element.pcb_plated_hole_id])
        });
      }
    } else if (element.type === "pcb_trace") {
      const traceObstacles = getObstaclesFromRoute(
        element.route.map((rp) => ({
          x: rp.x,
          y: rp.y,
          layer: "layer" in rp ? rp.layer : rp.from_layer
        })),
        element.source_trace_id
      );
      obstacles.push(...traceObstacles);
    } else if (element.type === "pcb_via") {
      obstacles.push({
        type: "rect",
        layers: element.layers,
        center: {
          x: element.x,
          y: element.y
        },
        connectedTo: [],
        // TODO we can associate source_ports with this via
        width: element.outer_diameter,
        height: element.outer_diameter
      });
    }
  }
  return obstacles;
};

// module/lib/solver-utils/timer.ts
import now from "performance-now";

// module/lib/solver-utils/getAlternativeGoalBoxes.ts
import "circuit-json-to-connectivity-map";
import { findNearestPointsBetweenBoxSets } from "@tscircuit/math-utils/nearest-box";
function getAlternativeGoalBoxes(params) {
  const { pcbConnMap, goalElementId } = params;
  if (!goalElementId.startsWith("pcb_port_")) {
    throw new Error(
      `Currently alternative goal boxes must have a goal id with prefix "pcb_port_" (got ${goalElementId})`
    );
  }
  const goalTraces = pcbConnMap.getAllTracesConnectedToPort(goalElementId);
  return getObstaclesFromCircuitJson(goalTraces).map((obs) => ({
    ...obs,
    connectedTo: [goalElementId]
  }));
}
var getConnectionWithAlternativeGoalBoxes = (params) => {
  let { connection, pcbConnMap } = params;
  if (connection.pointsToConnect.length !== 2) {
    throw new Error(
      `Connection must have exactly 2 points for alternative goal boxes (got ${connection.pointsToConnect.length})`
    );
  }
  const [a, b] = connection.pointsToConnect;
  if (!a.pcb_port_id || !b.pcb_port_id) {
    throw new Error(
      `Connection points must have pcb_port_id for alternative goal box calculation (got ${a.pcb_port_id} and ${b.pcb_port_id})`
    );
  }
  const goalBoxesA = getAlternativeGoalBoxes({
    goalElementId: a.pcb_port_id,
    pcbConnMap
  }).concat([
    {
      center: a,
      width: 0.01,
      height: 0.01,
      connectedTo: [a.pcb_port_id],
      layers: [a.layer],
      type: "rect"
    }
  ]);
  const goalBoxesB = getAlternativeGoalBoxes({
    goalElementId: b.pcb_port_id,
    pcbConnMap
  }).concat([
    {
      center: b,
      width: 0.01,
      height: 0.01,
      connectedTo: [b.pcb_port_id],
      layers: [b.layer],
      type: "rect"
    }
  ]);
  if (goalBoxesA.length <= 1 && goalBoxesB.length <= 1) {
    return {
      ...connection,
      startPoint: a,
      endPoint: b,
      goalBoxes: []
    };
  }
  const nearestPoints = findNearestPointsBetweenBoxSets(goalBoxesA, goalBoxesB);
  let startPoint;
  let endPoint;
  let goalBoxes;
  if (goalBoxesA.length >= goalBoxesB.length) {
    startPoint = { ...b, ...nearestPoints.pointB };
    endPoint = { ...a, ...nearestPoints.pointA };
    goalBoxes = goalBoxesA;
  } else {
    startPoint = { ...a, ...nearestPoints.pointA };
    endPoint = { ...b, ...nearestPoints.pointB };
    goalBoxes = goalBoxesB;
  }
  return {
    startPoint,
    endPoint,
    goalBoxes,
    name: connection.name,
    pointsToConnect: [startPoint, endPoint]
  };
};

// module/lib/solver-utils/getSimpleRouteJson.ts
import {
  PcbConnectivityMap as PcbConnectivityMap2
} from "circuit-json-to-connectivity-map";
var getSimpleRouteJson = (circuitJson, opts = {}) => {
  const routeJson = {
    minTraceWidth: 0.1
  };
  routeJson.layerCount = opts.layerCount ?? 1;
  routeJson.obstacles = getObstaclesFromCircuitJson(circuitJson, opts.connMap);
  routeJson.connections = [];
  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      const alreadyConnected = circuitJson.some(
        (e) => e.type === "pcb_trace" && e.source_trace_id === element.source_trace_id
      );
      if (alreadyConnected) {
        continue;
      }
      let connection = {
        name: element.source_trace_id,
        pointsToConnect: element.connected_source_port_ids.map((portId) => {
          const pcb_port = su(circuitJson).pcb_port.getWhere({
            source_port_id: portId
          });
          if (!pcb_port) {
            throw new Error(
              `Could not find pcb_port for source_port_id "${portId}"`
            );
          }
          return {
            x: pcb_port.x,
            y: pcb_port.y,
            layer: pcb_port.layers?.[0] ?? "top",
            pcb_port_id: pcb_port.pcb_port_id
          };
        })
      };
      if (opts.optimizeWithGoalBoxes) {
        const pcbConnMap = new PcbConnectivityMap2(circuitJson);
        connection = getConnectionWithAlternativeGoalBoxes({
          connection,
          pcbConnMap
        });
      }
      routeJson.connections.push(connection);
      markObstaclesAsConnected(
        routeJson.obstacles,
        connection.pointsToConnect,
        connection.name
      );
    }
  }
  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  };
  for (const obstacle of routeJson.obstacles) {
    bounds.minX = Math.min(bounds.minX, obstacle.center.x - obstacle.width / 2);
    bounds.maxX = Math.max(bounds.maxX, obstacle.center.x + obstacle.width / 2);
    bounds.minY = Math.min(bounds.minY, obstacle.center.y - obstacle.height / 2);
    bounds.maxY = Math.max(bounds.maxY, obstacle.center.y + obstacle.height / 2);
  }
  for (const connection of routeJson.connections) {
    for (const point of connection.pointsToConnect) {
      bounds.minX = Math.min(bounds.minX, point.x);
      bounds.maxX = Math.max(bounds.maxX, point.x);
      bounds.minY = Math.min(bounds.minY, point.y);
      bounds.maxY = Math.max(bounds.maxY, point.y);
    }
  }
  routeJson.bounds = bounds;
  return routeJson;
};
var markObstaclesAsConnected = (obstacles, pointsToConnect, connectionName) => {
  for (const point of pointsToConnect) {
    for (const obstacle of obstacles) {
      if (isPointInsideObstacle(point, obstacle)) {
        obstacle.connectedTo.push(connectionName);
      }
    }
  }
};
function isPointInsideObstacle(point, obstacle) {
  const halfWidth = obstacle.width / 2;
  const halfHeight = obstacle.height / 2;
  if (obstacle.type === "rect") {
    return point.x >= obstacle.center.x - halfWidth && point.x <= obstacle.center.x + halfWidth && point.y >= obstacle.center.y - halfHeight && point.y <= obstacle.center.y + halfHeight;
  } else if (obstacle.type === "oval") {
    const normalizedX = (point.x - obstacle.center.x) / halfWidth;
    const normalizedY = (point.y - obstacle.center.y) / halfHeight;
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }
  return false;
}

// algos/infinite-grid-ijump-astar/v2/lib/IJumpMultiMarginAutorouter.ts
var IJumpMultiMarginAutorouter = class extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS = 500;
  /**
   * For a multi-margin autorouter, we penalize traveling close to the wall
   *
   * The best way to compute cost is to multiple the travelMargin cost factor by
   * the distance traveled by along the wall and add the enterMargin cost factor
   * whenever we enter a new margin
   *
   * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
   */
  marginsWithCosts = [
    {
      margin: 1,
      enterCost: 0,
      travelCostFactor: 1
    },
    {
      margin: 0.15,
      enterCost: 10,
      travelCostFactor: 2
    }
  ];
  get largestMargin() {
    return this.marginsWithCosts[0].margin;
  }
  computeG(current2, neighbor) {
    return current2.g + manDist(current2, neighbor) * (current2.travelMarginCostFactor ?? 1) + (neighbor.enterMarginCost ?? 0);
  }
  getNeighbors(node) {
    const obstacles = this.obstacles;
    const goalPoint = this.goalPoint;
    let forwardDir;
    if (!node.parent) {
      forwardDir = dirFromAToB(node, goalPoint);
    } else {
      forwardDir = dirFromAToB(node.parent, node);
    }
    const travelDirs1 = [
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 }
    ].filter((dir) => {
      if (dir.dx === forwardDir.dx * -1 && dir.dy === forwardDir.dy * -1) {
        return false;
      } else if (dir.dx === forwardDir.dx && dir.dy === forwardDir.dy && node.parent?.obstacleHit) {
        return false;
      }
      return true;
    }).map(
      (dir) => obstacles.getOrthoDirectionCollisionInfo(node, dir, {
        margin: this.OBSTACLE_MARGIN
      })
    ).filter((dir) => dir.wallDistance >= this.OBSTACLE_MARGIN);
    const travelDirs2 = [];
    for (const travelDir of travelDirs1) {
      let overcomeDistance = null;
      if (node?.obstacleHit) {
        overcomeDistance = getDistanceToOvercomeObstacle({
          node,
          travelDir,
          wallDir: { ...forwardDir, wallDistance: this.OBSTACLE_MARGIN },
          obstacle: node.obstacleHit,
          obstacles,
          OBSTACLE_MARGIN: this.OBSTACLE_MARGIN,
          SHOULD_DETECT_CONJOINED_OBSTACLES: true
        });
      }
      const goalDistAlongTravelDir = distAlongDir(node, goalPoint, travelDir);
      const isGoalInTravelDir = (travelDir.dx === 0 || Math.sign(goalPoint.x - node.x) === travelDir.dx) && (travelDir.dy === 0 || Math.sign(goalPoint.y - node.y) === travelDir.dy);
      if (goalDistAlongTravelDir < travelDir.wallDistance && goalDistAlongTravelDir > 0 && isGoalInTravelDir) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: goalDistAlongTravelDir,
          enterMarginCost: 0,
          travelMarginCostFactor: 1
        });
      } else if (overcomeDistance !== null && overcomeDistance < travelDir.wallDistance) {
        for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
          if (overcomeDistance - this.OBSTACLE_MARGIN + margin * 2 < travelDir.wallDistance) {
            travelDirs2.push({
              ...travelDir,
              travelDistance: overcomeDistance - this.OBSTACLE_MARGIN + margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor
            });
          }
        }
        if (travelDir.wallDistance === Infinity) {
          travelDirs2.push({
            ...travelDir,
            travelDistance: goalDistAlongTravelDir,
            enterMarginCost: 0,
            travelMarginCostFactor: 1
          });
        } else if (travelDir.wallDistance > this.largestMargin) {
          for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
            if (travelDir.wallDistance > this.largestMargin + margin) {
              travelDirs2.push({
                ...travelDir,
                travelDistance: travelDir.wallDistance - margin,
                enterMarginCost: enterCost,
                travelMarginCostFactor: travelCostFactor
              });
            }
          }
        }
      } else if (travelDir.wallDistance !== Infinity) {
        for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
          if (travelDir.wallDistance > margin) {
            travelDirs2.push({
              ...travelDir,
              travelDistance: travelDir.wallDistance - margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor
            });
          }
        }
      }
    }
    return travelDirs2.filter((dir) => {
      return !obstacles.isObstacleAt(
        node.x + dir.dx * dir.travelDistance,
        node.y + dir.dy * dir.travelDistance
      );
    }).map((dir) => ({
      x: node.x + dir.dx * dir.travelDistance,
      y: node.y + dir.dy * dir.travelDistance,
      obstacleHit: dir.obstacle,
      travelMarginCostFactor: dir.travelMarginCostFactor,
      enterMarginCost: dir.enterMarginCost
    }));
  }
};

// algos/multi-layer-ijump/util.ts
function dirFromAToB2(nodeA, nodeB) {
  const dx = nodeB.x > nodeA.x ? 1 : nodeB.x < nodeA.x ? -1 : 0;
  const dy = nodeB.y > nodeA.y ? 1 : nodeB.y < nodeA.y ? -1 : 0;
  const dl = nodeB.l > nodeA.l ? 1 : nodeB.l < nodeA.l ? -1 : 0;
  return { dx, dy, dl };
}
var LAYER_COUNT_INDEX_MAP = {
  1: ["top"],
  2: ["top", "bottom"],
  4: ["top", "inner1", "inner2", "bottom"]
};
var getLayerNamesForLayerCount = (layerCount) => {
  return LAYER_COUNT_INDEX_MAP[layerCount];
};
function getLayerIndex(layerCount, layer) {
  const layerArray = LAYER_COUNT_INDEX_MAP[layerCount];
  const index = layerArray.indexOf(layer);
  if (index === -1) {
    throw new Error(
      `Invalid layer for getLayerIndex (for layerCount === ${layerCount}): "${layer}"`
    );
  }
  return index;
}
function indexToLayer(layerCount, index) {
  const layerArray = LAYER_COUNT_INDEX_MAP[layerCount];
  const layer = layerArray[index];
  if (!layer) {
    throw new Error(
      `Invalid index for indexToLayer (for layerCount === ${layerCount}): "${index}"`
    );
  }
  return layer;
}

// algos/multi-layer-ijump/ObstacleList3d.ts
var ObstacleList3d = class extends ObstacleList {
  obstacles;
  GRID_STEP = 0.1;
  layerCount;
  constructor(layerCount, obstacles) {
    super([]);
    this.layerCount = layerCount;
    const availableLayers = getLayerNamesForLayerCount(layerCount);
    this.obstacles = obstacles.flatMap(
      (obstacle) => obstacle.layers.filter((layer) => availableLayers.includes(layer)).map((layer) => ({
        ...obstacle,
        left: obstacle.center.x - obstacle.width / 2,
        right: obstacle.center.x + obstacle.width / 2,
        top: obstacle.center.y + obstacle.height / 2,
        bottom: obstacle.center.y - obstacle.height / 2,
        l: getLayerIndex(layerCount, layer)
      }))
    );
  }
  getObstacleAt(x, y, l, m) {
    m ??= this.GRID_STEP;
    for (const obstacle of this.obstacles) {
      if (obstacle.l !== l) continue;
      const halfWidth = obstacle.width / 2 + m;
      const halfHeight = obstacle.height / 2 + m;
      if (x >= obstacle.center.x - halfWidth && x <= obstacle.center.x + halfWidth && y >= obstacle.center.y - halfHeight && y <= obstacle.center.y + halfHeight) {
        return obstacle;
      }
    }
    return null;
  }
  isObstacleAt(x, y, l, m) {
    return this.getObstacleAt(x, y, l, m) !== null;
  }
  getDirectionDistancesToNearestObstacle3d(x, y, l) {
    const { GRID_STEP } = this;
    const result = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity
    };
    for (const obstacle of this.obstacles) {
      if (obstacle.l !== l) continue;
      if (obstacle.type === "rect") {
        const left = obstacle.center.x - obstacle.width / 2 - GRID_STEP;
        const right = obstacle.center.x + obstacle.width / 2 + GRID_STEP;
        const top = obstacle.center.y + obstacle.height / 2 + GRID_STEP;
        const bottom = obstacle.center.y - obstacle.height / 2 - GRID_STEP;
        if (y >= bottom && y <= top && x > left) {
          result.left = Math.min(result.left, x - right);
        }
        if (y >= bottom && y <= top && x < right) {
          result.right = Math.min(result.right, left - x);
        }
        if (x >= left && x <= right && y < top) {
          result.top = Math.min(result.top, bottom - y);
        }
        if (x >= left && x <= right && y > bottom) {
          result.bottom = Math.min(result.bottom, y - top);
        }
      }
    }
    return result;
  }
  getOrthoDirectionCollisionInfo(point, dir, { margin = 0 } = {}) {
    const { x, y, l } = point;
    const { dx, dy, dl } = dir;
    let minDistance = Infinity;
    let collisionObstacle = null;
    if (dl !== 0) {
      const newLayer = l + dl;
      if (this.isObstacleAt(x, y, newLayer, margin)) {
        minDistance = 1;
        collisionObstacle = this.getObstacleAt(
          x,
          y,
          newLayer,
          margin
        );
      } else {
        minDistance = 1;
      }
      return {
        dx,
        dy,
        dl,
        wallDistance: minDistance,
        obstacle: collisionObstacle
      };
    } else {
      for (const obstacle of this.obstacles) {
        if (obstacle.l !== l) continue;
        const leftMargin = obstacle.left - margin;
        const rightMargin = obstacle.right + margin;
        const topMargin = obstacle.top + margin;
        const bottomMargin = obstacle.bottom - margin;
        let distance = null;
        if (dx === 1 && dy === 0) {
          if (y > bottomMargin && y < topMargin && x < obstacle.left) {
            distance = obstacle.left - x;
          }
        } else if (dx === -1 && dy === 0) {
          if (y > bottomMargin && y < topMargin && x > obstacle.right) {
            distance = x - obstacle.right;
          }
        } else if (dx === 0 && dy === 1) {
          if (x > leftMargin && x < rightMargin && y < obstacle.bottom) {
            distance = obstacle.bottom - y;
          }
        } else if (dx === 0 && dy === -1) {
          if (x > leftMargin && x < rightMargin && y > obstacle.top) {
            distance = y - obstacle.top;
          }
        }
        if (distance !== null && distance < minDistance) {
          minDistance = distance;
          collisionObstacle = obstacle;
        }
      }
      return {
        dx,
        dy,
        dl: 0,
        wallDistance: minDistance,
        obstacle: collisionObstacle
      };
    }
  }
  getObstaclesOverlappingRegion(region) {
    const obstacles = [];
    for (const obstacle of this.obstacles) {
      if (obstacle.l !== region.l) continue;
      const { left, right, top, bottom } = obstacle;
      if (left <= region.maxX && right >= region.minX && top >= region.minY && bottom <= region.maxY) {
        obstacles.push(obstacle);
      }
    }
    return obstacles;
  }
};

// algos/multi-layer-ijump/MultilayerIjump.ts
import {
  PcbConnectivityMap as PcbConnectivityMap3
} from "circuit-json-to-connectivity-map";
import { nanoid } from "nanoid";
var MultilayerIjump = class extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS = 500;
  VIA_COST = 4;
  // Define the cost for changing layers
  VIA_DIAMETER = 0.5;
  allowLayerChange = true;
  // Flag to allow layer changes
  layerCount;
  obstacles;
  optimizeWithGoalBoxes;
  /**
   * Use this to convert ids into "net ids", obstacles will have a net id in
   * their connectedTo array most of the time
   */
  connMap;
  /**
   * Use this to track what traces have been connected to a net while routing,
   * this is required for generating alternative goal boxes while routing
   */
  pcbConnMap;
  GOAL_RUSH_FACTOR = 1.1;
  // TODO we need to travel far enough away from the goal so that we're not
  // hitting a pad, which means we need to know the bounds of the goal
  // The simplest way to do this is to change SimpleJsonInput to include a
  // goalViaMargin, set this.goalViaMargin then add that value here
  defaultGoalViaMargin = 0.5;
  /**
   * For a multi-margin autorouter, we penalize traveling close to the wall
   *
   * The best way to compute cost is to multiple the travelMargin cost factor by
   * the distance traveled by along the wall and add the enterMargin cost factor
   * whenever we enter a new margin
   *
   * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
   */
  marginsWithCosts;
  get largestMargin() {
    return this.marginsWithCosts[0].margin;
  }
  constructor(opts) {
    super(opts);
    this.layerCount = opts.input.layerCount ?? 2;
    this.MAX_ITERATIONS = opts.MAX_ITERATIONS ?? this.MAX_ITERATIONS;
    this.VIA_COST = opts.VIA_COST ?? this.VIA_COST;
    this.connMap = opts.connMap;
    this.pcbConnMap = opts.pcbConnMap ?? new PcbConnectivityMap3();
    this.optimizeWithGoalBoxes = opts.optimizeWithGoalBoxes ?? false;
    this.obstacles = null;
    this.marginsWithCosts = opts.marginsWithCosts ?? [
      {
        margin: 1,
        enterCost: 0,
        travelCostFactor: 1
      },
      {
        margin: this.OBSTACLE_MARGIN,
        enterCost: 10,
        travelCostFactor: 2
      }
    ];
  }
  preprocessConnectionBeforeSolving(connection) {
    if (!this.optimizeWithGoalBoxes) return connection;
    return getConnectionWithAlternativeGoalBoxes({
      connection,
      pcbConnMap: this.pcbConnMap
    });
  }
  /**
   * Add solved traces to pcbConnMap
   */
  postprocessConnectionSolveResult(connection, result) {
    if (!result.solved) return result;
    if (this.optimizeWithGoalBoxes) {
      const traceRoute = result.route.map(
        (rp) => ({
          x: rp.x,
          y: rp.y,
          route_type: "wire",
          layer: rp.layer,
          width: this.input.minTraceWidth
        })
      );
      traceRoute[0].start_pcb_port_id = connection.pointsToConnect[0].pcb_port_id;
      traceRoute[traceRoute.length - 1].end_pcb_port_id = connection.pointsToConnect[1].pcb_port_id;
      this.pcbConnMap.addTrace({
        type: "pcb_trace",
        pcb_trace_id: `postprocess_trace_${nanoid(8)}`,
        route: traceRoute
      });
    }
    return result;
  }
  createObstacleList({
    dominantLayer,
    connection,
    obstaclesFromTraces
  }) {
    const bestConnectionId = this.connMap ? this.connMap.getNetConnectedToId(connection.name) : connection.name;
    if (!bestConnectionId) {
      throw new Error(
        `The connection.name "${connection.name}" wasn't present in the full connectivity map`
      );
    }
    return new ObstacleList3d(
      this.layerCount,
      this.allObstacles.filter((obstacle) => !obstacle.connectedTo.includes(bestConnectionId)).concat(obstaclesFromTraces ?? [])
    );
  }
  computeG(current2, neighbor) {
    let cost = current2.g + manDist(current2, neighbor) * (current2.travelMarginCostFactor ?? 1) + (neighbor.enterMarginCost ?? 0);
    if (neighbor.l ?? -1 !== current2.l ?? -1) {
      cost += this.VIA_COST;
    }
    return cost;
  }
  computeH(node) {
    const dx = Math.abs(node.x - this.goalPoint.x);
    const dy = Math.abs(node.y - this.goalPoint.y);
    const dl = Math.abs(node.l - this.goalPoint.l);
    return (dx + dy) ** this.GOAL_RUSH_FACTOR + dl * this.VIA_COST;
  }
  getStartNode(connection) {
    return {
      ...super.getStartNode(connection),
      l: this.layerToIndex(connection.pointsToConnect[0].layer)
    };
  }
  layerToIndex(layer) {
    return getLayerIndex(this.layerCount, layer);
  }
  indexToLayer(index) {
    return indexToLayer(this.layerCount, index);
  }
  getNodeName(node) {
    return `${nodeName(node, this.GRID_STEP)}-${node.l ?? 0}`;
  }
  hasSpaceForVia(layers, point) {
    return layers.every(
      (l) => this.obstacles.getObstaclesOverlappingRegion({
        minX: point.x - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
        minY: point.y - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
        maxX: point.x + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
        maxY: point.y + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
        l
      }).length === 0
    );
  }
  getNeighborsSurroundingGoal(node) {
    const obstacles = this.obstacles;
    const goalPoint = this.goalPoint;
    const neighbors = [];
    const travelDirs = [
      { dx: 1, dy: 0, dl: 0 },
      { dx: -1, dy: 0, dl: 0 },
      { dx: 0, dy: 1, dl: 0 },
      { dx: 0, dy: -1, dl: 0 }
    ];
    const travelDistance = this.VIA_DIAMETER + this.OBSTACLE_MARGIN + this.defaultGoalViaMargin;
    for (const dir of travelDirs) {
      const candidateNeighbor = {
        x: node.x + dir.dx * travelDistance,
        y: node.y + dir.dy * travelDistance,
        l: node.l + dir.dl,
        obstacleHit: null
      };
      if (!this.hasSpaceForVia([node.l, goalPoint.l], candidateNeighbor)) {
        continue;
      }
      neighbors.push(candidateNeighbor);
    }
    return neighbors;
  }
  getNeighbors(node) {
    const obstacles = this.obstacles;
    const goalPoint = this.goalPoint;
    const goalDistIgnoringLayer = manDist(node, goalPoint);
    if (goalDistIgnoringLayer <= this.OBSTACLE_MARGIN) {
      return this.getNeighborsSurroundingGoal(node);
    }
    let forwardDir;
    if (!node.parent) {
      forwardDir = dirFromAToB2(node, goalPoint);
    } else {
      forwardDir = dirFromAToB2(node.parent, node);
    }
    const travelDirs1 = [
      { dx: 0, dy: 1, dl: 0 },
      { dx: 1, dy: 0, dl: 0 },
      { dx: 0, dy: -1, dl: 0 },
      { dx: -1, dy: 0, dl: 0 }
    ];
    const isFarEnoughFromGoalToChangeLayer = goalDistIgnoringLayer > this.VIA_DIAMETER + this.OBSTACLE_MARGIN;
    const isFarEnoughFromStartToChangeLayer = manDist(node, this.startNode) > this.VIA_DIAMETER + this.OBSTACLE_MARGIN;
    if (this.allowLayerChange && isFarEnoughFromGoalToChangeLayer && isFarEnoughFromStartToChangeLayer) {
      if (node.l < this.layerCount - 1) {
        travelDirs1.push({ dx: 0, dy: 0, dl: 1 });
      }
      if (node.l > 0) {
        travelDirs1.push({ dx: 0, dy: 0, dl: -1 });
      }
    }
    const travelDirs2 = travelDirs1.filter((dir) => {
      if (dir.dx === forwardDir.dx * -1 && dir.dy === forwardDir.dy * -1 && dir.dl === forwardDir.dl * -1) {
        return false;
      } else if (dir.dx === forwardDir.dx && dir.dy === forwardDir.dy && dir.dl === forwardDir.dl && node.parent?.obstacleHit) {
        return false;
      }
      return true;
    }).map((dir) => {
      const collisionInfo = obstacles.getOrthoDirectionCollisionInfo(
        node,
        dir,
        {
          margin: this.OBSTACLE_MARGIN
        }
      );
      return collisionInfo;
    }).filter((dir) => !(dir.wallDistance < this.OBSTACLE_MARGIN));
    const travelDirs3 = [];
    for (const travelDir of travelDirs2) {
      const isDownVia = travelDir.dx === 0 && travelDir.dy === 0 && travelDir.dl === 1;
      const isUpVia = travelDir.dx === 0 && travelDir.dy === 0 && travelDir.dl === -1;
      if (isDownVia || isUpVia) {
        const hasSpaceForVia = [node.l, node.l + travelDir.dl].every(
          (l) => obstacles.getObstaclesOverlappingRegion({
            minX: node.x - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
            minY: node.y - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
            maxX: node.x + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
            maxY: node.y + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
            l
          }).length === 0
        );
        if (!hasSpaceForVia) {
          continue;
        }
      }
      if (isDownVia) {
        if (node.l < this.layerCount - 1) {
          travelDirs3.push({
            ...travelDir,
            travelDistance: 0,
            enterMarginCost: 0,
            travelMarginCostFactor: 1
          });
        }
        continue;
      }
      if (isUpVia) {
        if (node.l > 0) {
          travelDirs3.push({
            ...travelDir,
            travelDistance: 0,
            enterMarginCost: 0,
            travelMarginCostFactor: 1
          });
        }
        continue;
      }
      let overcomeDistance = null;
      if (node?.obstacleHit) {
        overcomeDistance = getDistanceToOvercomeObstacle({
          node,
          travelDir,
          wallDir: { ...forwardDir, wallDistance: this.OBSTACLE_MARGIN },
          obstacle: node.obstacleHit,
          obstacles,
          OBSTACLE_MARGIN: this.OBSTACLE_MARGIN,
          SHOULD_DETECT_CONJOINED_OBSTACLES: true
        });
      }
      const goalDistAlongTravelDir = distAlongDir(node, goalPoint, travelDir);
      const isGoalInTravelDir = (travelDir.dx === 0 || Math.sign(goalPoint.x - node.x) === travelDir.dx) && (travelDir.dy === 0 || Math.sign(goalPoint.y - node.y) === travelDir.dy);
      if (goalDistAlongTravelDir < travelDir.wallDistance && goalDistAlongTravelDir > 0 && isGoalInTravelDir) {
        const isGoalOnSameLayer = node.l === goalPoint.l;
        let stopShortDistance = 0;
        if (!isGoalOnSameLayer && Math.abs(goalDistAlongTravelDir - goalDistIgnoringLayer) < this.GRID_STEP) {
          stopShortDistance = this.VIA_DIAMETER + this.OBSTACLE_MARGIN + this.defaultGoalViaMargin;
        }
        travelDirs3.push({
          ...travelDir,
          travelDistance: goalDistAlongTravelDir - stopShortDistance,
          enterMarginCost: 0,
          travelMarginCostFactor: 1
        });
      } else if (overcomeDistance !== null && overcomeDistance < travelDir.wallDistance) {
        for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
          if (overcomeDistance - this.OBSTACLE_MARGIN + margin * 2 < travelDir.wallDistance) {
            travelDirs3.push({
              ...travelDir,
              travelDistance: overcomeDistance - this.OBSTACLE_MARGIN + margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor
            });
          }
        }
        // tscircuit/core#3927 (tscircuit/autorouting#92): do not add a "cross the
        // goal axis" stop for an open direction here. The goal-axis branch above
        // already covers the case where the goal is ahead along this direction;
        // if we got here the goal is behind (or level), so goalDistAlongTravelDir
        // is the distance AWAY from the goal. Pushing it emitted a neighbor at
        // node + dir * |goal - node|, mirrored away from the goal, which A*
        // expanded into the wild trace jumps.
        if (
          travelDir.wallDistance !== Infinity &&
          travelDir.wallDistance > this.largestMargin
        ) {
          for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
            if (travelDir.wallDistance > this.largestMargin + margin) {
              travelDirs3.push({
                ...travelDir,
                travelDistance: travelDir.wallDistance - margin,
                enterMarginCost: enterCost,
                travelMarginCostFactor: travelCostFactor
              });
            }
          }
        }
      } else if (travelDir.wallDistance !== Infinity) {
        for (const { margin, enterCost, travelCostFactor } of this.marginsWithCosts) {
          if (travelDir.wallDistance > margin) {
            travelDirs3.push({
              ...travelDir,
              travelDistance: travelDir.wallDistance - margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor
            });
          }
        }
      }
    }
    return travelDirs3.map((dir) => ({
      x: node.x + dir.dx * dir.travelDistance,
      y: node.y + dir.dy * dir.travelDistance,
      l: node.l + dir.dl,
      obstacleHit: dir.obstacle,
      travelMarginCostFactor: dir.travelMarginCostFactor,
      enterMarginCost: dir.enterMarginCost
    }));
  }
};

// algos/multi-layer-ijump/index.ts
import { getFullConnectivityMapFromCircuitJson as getFullConnectivityMapFromCircuitJson3 } from "circuit-json-to-connectivity-map";
function autoroute(soup) {
  const connMap = getFullConnectivityMapFromCircuitJson3(soup);
  const input = getSimpleRouteJson(soup, {
    layerCount: 2,
    connMap
  });
  const autorouter = new MultilayerIjump({
    input,
    connMap,
    isRemovePathLoopsEnabled: true,
    optimizeWithGoalBoxes: true
  });
  const solution = autorouter.solveAndMapToTraces();
  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage
  };
}

// algos/infinite-grid-ijump-astar/v2/index.ts
function autoroute2(soup) {
  const input = getSimpleRouteJson(soup);
  const autorouter = new IJumpAutorouter({
    input
  });
  const solution = autorouter.solveAndMapToTraces();
  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage
  };
}
function autorouteMultiMargin(soup) {
  const input = getSimpleRouteJson(soup);
  const autorouter = new IJumpMultiMarginAutorouter({
    input,
    isRemovePathLoopsEnabled: true
  });
  const solution = autorouter.solveAndMapToTraces();
  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage
  };
}
var getObstaclesFromSoup = getObstaclesFromCircuitJson;
export {
  IJumpAutorouter,
  IJumpMultiMarginAutorouter,
  MultilayerIjump,
  autoroute2 as autoroute,
  autoroute as autorouteMultiLayer,
  autorouteMultiMargin,
  getObstaclesFromCircuitJson,
  getObstaclesFromSoup,
  getSimpleRouteJson,
  isPointInsideObstacle,
  markObstaclesAsConnected
};
//# sourceMappingURL=index.js.map