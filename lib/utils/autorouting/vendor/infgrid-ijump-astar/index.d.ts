// Vendored from @tscircuit/infgrid-ijump-astar@0.0.35 (dist/index.d.ts).
// See index.js header for provenance and the applied patch.
import * as circuit_json_to_connectivity_map from 'circuit-json-to-connectivity-map';
import { ConnectivityMap, PcbConnectivityMap } from 'circuit-json-to-connectivity-map';
import { AnyCircuitElement } from 'circuit-json';

type SimplifiedPcbTrace = {
    type: "pcb_trace";
    pcb_trace_id: string;
    route: Array<{
        route_type: "wire";
        x: number;
        y: number;
        width: number;
        layer: string;
    } | {
        route_type: "via";
        from_layer: string;
        to_layer: string;
        x: number;
        y: number;
    }>;
};
type Obstacle = {
    type: "rect";
    layers: string[];
    center: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    connectedTo: string[];
};
interface ObstacleWithEdges extends Obstacle {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/**
 * A connection with goal alternatives is a 2 point connection that has a single
 * start point, but many possible "goal boxes". Touching any goal box will connect
 * you to the network and finish the connection
 */
interface ConnectionWithGoalAlternatives extends SimpleRouteConnection {
    startPoint: PointWithLayer$1;
    endPoint: PointWithLayer$1;
    goalBoxes: Obstacle[];
}

interface PointWithLayer$1 {
    x: number;
    y: number;
    layer: string;
    pcb_port_id?: string;
}
interface SimpleRouteConnection {
    name: string;
    pointsToConnect: Array<PointWithLayer$1>;
}
interface SimpleRouteJson {
    layerCount: number;
    minTraceWidth: number;
    obstacles: Obstacle[];
    connections: Array<SimpleRouteConnection | ConnectionWithGoalAlternatives>;
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

declare const getSimpleRouteJson: (circuitJson: AnyCircuitElement[], opts?: {
    layerCount?: number;
    optimizeWithGoalBoxes?: boolean;
    connMap?: ConnectivityMap;
}) => SimpleRouteJson;
declare const markObstaclesAsConnected: (obstacles: Obstacle[], pointsToConnect: Array<{
    x: number;
    y: number;
}>, connectionName: string) => void;
declare function isPointInsideObstacle(point: {
    x: number;
    y: number;
}, obstacle: {
    type: string;
    center: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}): boolean;

declare const getObstaclesFromCircuitJson: (soup: AnyCircuitElement[], connMap?: ConnectivityMap) => Obstacle[];

type SolutionWithDebugInfo<SolElm extends AnyCircuitElement | SimplifiedPcbTrace = AnyCircuitElement | SimplifiedPcbTrace> = {
    solution: SolElm[];
    /**
     * Solvers can return a debugSolutions object that contains various stages or
     * debugging information to understand the output of the solver. There is
     * a dropdown menu when using the server that allows you to explore each
     * debugSolution output. The debugSolutions don't need to actually solve the
     * problem, you can just output fabrication_notes etc. for debugging.
     *
     * For a good example of debugSolutions, check out the gridless-poi solver
     * that outputs a visualization of it's mesh.
     */
    debugSolutions?: Record<string, AnyCircuitElement[]>;
    /**
     * Solvers can return a debugMessage, usually with the iteration count or odd
     * cases etc. This is displayed below the solution in the dev server.
     */
    debugMessage?: string | null;
};

interface DirectionDistances {
    left: number;
    top: number;
    bottom: number;
    right: number;
}
interface Direction {
    dx: number;
    dy: number;
}
interface DirectionWithCollisionInfo extends Direction {
    wallDistance: number;
    obstacle: Obstacle | null;
}
interface Point {
    x: number;
    y: number;
}
interface PointWithObstacleHit extends Point {
    obstacleHit?: Obstacle | null;
    /**
     * Used in multi-margin autorouter to penalize traveling close to the wall
     */
    travelMarginCostFactor?: number;
    enterMarginCost?: number;
}
interface Node extends Point {
    /** Distance from the parent node (along path) */
    g: number;
    /** Heuristic distance from the goal */
    h: number;
    /** Distance score for this node (g + h) */
    f: number;
    /** Manhattan Distance from the parent node */
    manDistFromParent: number;
    nodesInPath: number;
    obstacleHit?: Obstacle;
    parent: Node | null;
    /**
     * Used in multi-margin autorouter to penalize traveling close to the wall
     */
    travelMarginCostFactor?: number;
    enterMarginCost?: number;
    /**
     * Layer index, not needed for single-layer autorouters
     */
    l?: number;
}

/**
 * A list of obstacles with functions for fast lookups, this default implementation
 * has no optimizations, you should override this class to implement faster lookups
 */
declare class ObstacleList {
    protected obstacles: ObstacleWithEdges[];
    protected GRID_STEP: number;
    constructor(obstacles: Array<Obstacle>);
    getObstacleAt(x: number, y: number, m?: number): Obstacle | null;
    isObstacleAt(x: number, y: number, m?: number): boolean;
    getDirectionDistancesToNearestObstacle(x: number, y: number): DirectionDistances;
    getOrthoDirectionCollisionInfo(point: Point, dir: Direction, { margin }?: {
        margin?: number;
    }): DirectionWithCollisionInfo;
    getObstaclesOverlappingRegion(region: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }): ObstacleWithEdges[];
}

interface PointWithLayer extends Point {
    layer: string;
}
type ConnectionSolveResult = {
    solved: false;
    connectionName: string;
} | {
    solved: true;
    connectionName: string;
    route: PointWithLayer[];
};
declare class GeneralizedAstarAutorouter {
    openSet: Node[];
    closedSet: Set<string>;
    debug: boolean;
    debugSolutions?: Record<string, AnyCircuitElement[]>;
    debugMessage: string | null;
    debugTraceCount: number;
    input: SimpleRouteJson;
    obstacles?: ObstacleList;
    allObstacles: Obstacle[];
    startNode?: Node;
    goalPoint?: Point & {
        l: number;
    };
    GRID_STEP: number;
    OBSTACLE_MARGIN: number;
    MAX_ITERATIONS: number;
    isRemovePathLoopsEnabled: boolean;
    isShortenPathWithShortcutsEnabled: boolean;
    /**
     * Setting this greater than 1 makes the algorithm find suboptimal paths and
     * act more greedy, but at greatly improves performance.
     *
     * Recommended value is between 1.1 and 1.5
     */
    GREEDY_MULTIPLIER: number;
    iterations: number;
    constructor(opts: {
        input: SimpleRouteJson;
        startNode?: Node;
        goalPoint?: Point;
        GRID_STEP?: number;
        OBSTACLE_MARGIN?: number;
        MAX_ITERATIONS?: number;
        isRemovePathLoopsEnabled?: boolean;
        isShortenPathWithShortcutsEnabled?: boolean;
        debug?: boolean;
    });
    /**
     * Return points of interest for this node. Don't worry about checking if
     * points are already visited. You must check that these neighbors are valid
     * (not inside an obstacle)
     *
     * In a simple grid, this is just the 4 neighbors surrounding the node.
     *
     * In ijump-astar, this is the 2-4 surrounding intersections
     */
    getNeighbors(node: Node): Array<PointWithObstacleHit>;
    isSameNode(a: Point, b: Point): boolean;
    /**
     * Compute the cost of this path. In normal astar, this is just the length of
     * the path, but you can override this term to penalize paths that are more
     * complex.
     */
    computeG(current: Node, neighbor: Point): number;
    computeH(node: Point): number;
    getNodeName(node: Point): string;
    solveOneStep(): {
        solved: boolean;
        current: Node;
        newNeighbors: Node[];
    };
    getStartNode(connection: SimpleRouteConnection): Node;
    layerToIndex(layer: string): number;
    indexToLayer(index: number): string;
    /**
     * Add a preprocessing step before solving a connection to do adjust points
     * based on previous iterations. For example, if a previous connection solved
     * for a trace on the same net, you may want to preprocess the connection to
     * solve for an easier start and end point
     *
     * The simplest way to do this is to run getConnectionWithAlternativeGoalBoxes
     * with any pcb_traces created by previous iterations
     */
    preprocessConnectionBeforeSolving(connection: SimpleRouteConnection): SimpleRouteConnection;
    solveConnection(connection: SimpleRouteConnection): ConnectionSolveResult;
    createObstacleList({ dominantLayer, connection, obstaclesFromTraces, }: {
        dominantLayer?: string;
        connection: SimpleRouteConnection;
        obstaclesFromTraces: Obstacle[];
    }): ObstacleList;
    /**
     * Override this to implement smoothing strategies or incorporate new traces
     * into a connectivity map
     */
    postprocessConnectionSolveResult(connection: SimpleRouteConnection, result: ConnectionSolveResult): ConnectionSolveResult;
    /**
     * By default, this will solve the connections in the order they are given,
     * and add obstacles for each successfully solved connection. Override this
     * to implement "rip and replace" rerouting strategies.
     */
    solve(): ConnectionSolveResult[];
    solveAndMapToTraces(): SimplifiedPcbTrace[];
    getDebugGroup(): string | null;
    drawDebugTraceObstacles(obstacles: Obstacle[]): void;
    drawDebugSolution({ current, newNeighbors, }: {
        current: Node;
        newNeighbors: Node[];
    }): void;
}

declare class IJumpAutorouter extends GeneralizedAstarAutorouter {
    MAX_ITERATIONS: number;
    getNeighbors(node: Node): Array<PointWithObstacleHit>;
}

declare class IJumpMultiMarginAutorouter extends GeneralizedAstarAutorouter {
    MAX_ITERATIONS: number;
    /**
     * For a multi-margin autorouter, we penalize traveling close to the wall
     *
     * The best way to compute cost is to multiple the travelMargin cost factor by
     * the distance traveled by along the wall and add the enterMargin cost factor
     * whenever we enter a new margin
     *
     * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
     */
    marginsWithCosts: Array<{
        margin: number;
        enterCost: number;
        travelCostFactor: number;
    }>;
    get largestMargin(): number;
    computeG(current: Node, neighbor: Point): number;
    getNeighbors(node: Node): Array<PointWithObstacleHit>;
}

declare function autoroute$1(soup: AnyCircuitElement[]): SolutionWithDebugInfo;

type Direction3d = {
    dx: number;
    dy: number;
    /**
     * Always integer, usually -1 or 1, -1 indicating to go towards the top layer,
     * 1 indicating to go down a layer towards the bottom layer
     */
    dl: number;
};
interface Point3d {
    x: number;
    y: number;
    l: number;
}
interface Point3dWithObstacleHit extends Point3d {
    obstacleHit?: Obstacle | null;
}
interface Node3d extends Node {
    l: number;
    parent: Node3d | null;
}
interface Obstacle3d extends Obstacle {
    l: number;
}
interface ObstacleWithEdges3d extends Obstacle3d {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
interface DirectionWithCollisionInfo3d extends Direction3d {
    wallDistance: number;
    obstacle: Obstacle | null;
}
interface DirectionDistances3d {
    left: number;
    top: number;
    bottom: number;
    right: number;
}

/**
 * A list of obstacles with functions for fast lookups, this default implementation
 * has no optimizations, you should override this class to implement faster lookups
 */
declare class ObstacleList3d extends ObstacleList {
    obstacles: ObstacleWithEdges3d[];
    GRID_STEP: number;
    layerCount: number;
    constructor(layerCount: number, obstacles: Array<Obstacle>);
    getObstacleAt(x: number, y: number, l: number, m?: number): Obstacle | null;
    isObstacleAt(x: number, y: number, l: number, m?: number): boolean;
    getDirectionDistancesToNearestObstacle3d(x: number, y: number, l: number): DirectionDistances3d;
    getOrthoDirectionCollisionInfo(point: Point3d, dir: Direction3d, { margin }?: {
        margin?: number;
    }): DirectionWithCollisionInfo3d;
    getObstaclesOverlappingRegion(region: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        l: number;
    }): ObstacleWithEdges[];
}

declare class MultilayerIjump extends GeneralizedAstarAutorouter {
    MAX_ITERATIONS: number;
    VIA_COST: number;
    VIA_DIAMETER: number;
    allowLayerChange: boolean;
    layerCount: number;
    obstacles: ObstacleList3d;
    optimizeWithGoalBoxes: boolean;
    /**
     * Use this to convert ids into "net ids", obstacles will have a net id in
     * their connectedTo array most of the time
     */
    connMap: ConnectivityMap | undefined;
    /**
     * Use this to track what traces have been connected to a net while routing,
     * this is required for generating alternative goal boxes while routing
     */
    pcbConnMap: PcbConnectivityMap;
    GOAL_RUSH_FACTOR: number;
    defaultGoalViaMargin: number;
    /**
     * For a multi-margin autorouter, we penalize traveling close to the wall
     *
     * The best way to compute cost is to multiple the travelMargin cost factor by
     * the distance traveled by along the wall and add the enterMargin cost factor
     * whenever we enter a new margin
     *
     * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
     */
    marginsWithCosts: Array<{
        margin: number;
        enterCost: number;
        travelCostFactor: number;
    }>;
    get largestMargin(): number;
    constructor(opts: {
        input: SimpleRouteJson;
        startNode?: Node;
        goalPoint?: Point;
        GRID_STEP?: number;
        OBSTACLE_MARGIN?: number;
        MAX_ITERATIONS?: number;
        VIA_COST?: number;
        isRemovePathLoopsEnabled?: boolean;
        isShortenPathWithShortcutsEnabled?: boolean;
        connMap?: ConnectivityMap;
        pcbConnMap?: PcbConnectivityMap;
        optimizeWithGoalBoxes?: boolean;
        marginsWithCosts?: Array<{
            margin: number;
            enterCost: number;
            travelCostFactor: number;
        }>;
        debug?: boolean;
    });
    preprocessConnectionBeforeSolving(connection: SimpleRouteConnection): ConnectionWithGoalAlternatives;
    /**
     * Add solved traces to pcbConnMap
     */
    postprocessConnectionSolveResult(connection: SimpleRouteConnection, result: ConnectionSolveResult): ConnectionSolveResult;
    createObstacleList({ dominantLayer, connection, obstaclesFromTraces, }: {
        dominantLayer?: string;
        connection: SimpleRouteConnection;
        obstaclesFromTraces: Obstacle[];
    }): ObstacleList3d;
    computeG(current: Node3d, neighbor: Node3d): number;
    computeH(node: Node3d): number;
    getStartNode(connection: SimpleRouteConnection): Node3d;
    layerToIndex(layer: string): number;
    indexToLayer(index: number): string;
    getNodeName(node: Node3d): string;
    hasSpaceForVia(layers: number[], point: Point): boolean;
    getNeighborsSurroundingGoal(node: Node3d): Array<Point3dWithObstacleHit>;
    getNeighbors(node: Node3d): Array<Point3dWithObstacleHit>;
}

declare function autoroute(soup: AnyCircuitElement[]): SolutionWithDebugInfo;
declare function autorouteMultiMargin(soup: AnyCircuitElement[]): SolutionWithDebugInfo;
declare const getObstaclesFromSoup: (soup: AnyCircuitElement[], connMap?: circuit_json_to_connectivity_map.ConnectivityMap) => Obstacle[];

export { IJumpAutorouter, IJumpMultiMarginAutorouter, MultilayerIjump, autoroute, autoroute$1 as autorouteMultiLayer, autorouteMultiMargin, getObstaclesFromCircuitJson, getObstaclesFromSoup, getSimpleRouteJson, isPointInsideObstacle, markObstaclesAsConnected };
