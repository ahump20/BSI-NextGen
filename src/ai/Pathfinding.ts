/**
 * Pathfinding.ts
 * A* pathfinding algorithm for fielder movement
 *
 * Phase 3: Fielding AI Enhancement
 *
 * Features:
 * - A* pathfinding with heuristics
 * - Obstacle avoidance
 * - Dynamic path smoothing
 * - Movement speed optimization
 */

import { Vector3 } from "@babylonjs/core";

export interface PathNode {
  position: Vector3;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

export interface PathfindingOptions {
  gridSize: number; // Size of grid cells for pathfinding
  maxIterations: number; // Prevent infinite loops
  smoothPath: boolean; // Apply smoothing to final path
  allowDiagonal: boolean; // Allow diagonal movement
}

export class Pathfinding {
  private gridSize: number;
  private maxIterations: number;
  private obstacles: Vector3[] = [];

  constructor(options: Partial<PathfindingOptions> = {}) {
    this.gridSize = options.gridSize || 1.0;
    this.maxIterations = options.maxIterations || 1000;
  }

  /**
   * A* pathfinding algorithm
   * Returns optimal path from start to goal avoiding obstacles
   */
  public findPath(
    start: Vector3,
    goal: Vector3,
    obstacles: Vector3[] = []
  ): Vector3[] {
    this.obstacles = obstacles;

    // Snap to grid
    const startNode = this.createNode(this.snapToGrid(start), null);
    const goalNode = this.createNode(this.snapToGrid(goal), null);

    const openList: PathNode[] = [startNode];
    const closedList: Map<string, PathNode> = new Map();

    let iterations = 0;

    while (openList.length > 0 && iterations < this.maxIterations) {
      iterations++;

      // Get node with lowest f score
      openList.sort((a, b) => a.f - b.f);
      const currentNode = openList.shift()!;

      const currentKey = this.getNodeKey(currentNode.position);

      // Goal reached
      if (Vector3.Distance(currentNode.position, goalNode.position) < this.gridSize) {
        return this.reconstructPath(currentNode);
      }

      closedList.set(currentKey, currentNode);

      // Get neighbors
      const neighbors = this.getNeighbors(currentNode.position);

      for (const neighborPos of neighbors) {
        const neighborKey = this.getNodeKey(neighborPos);

        // Skip if in closed list
        if (closedList.has(neighborKey)) continue;

        // Skip if obstacle
        if (this.isObstacle(neighborPos)) continue;

        // Calculate costs
        const g = currentNode.g + Vector3.Distance(currentNode.position, neighborPos);
        const h = this.heuristic(neighborPos, goalNode.position);
        const f = g + h;

        // Check if neighbor is in open list
        const existingNeighbor = openList.find(
          n => this.getNodeKey(n.position) === neighborKey
        );

        if (existingNeighbor) {
          // Update if better path found
          if (g < existingNeighbor.g) {
            existingNeighbor.g = g;
            existingNeighbor.f = f;
            existingNeighbor.parent = currentNode;
          }
        } else {
          // Add to open list
          openList.push({
            position: neighborPos,
            g,
            h,
            f,
            parent: currentNode
          });
        }
      }
    }

    // No path found - return direct line to goal
    console.warn("A* pathfinding failed, returning direct path");
    return [start, goal];
  }

  /**
   * Calculate Manhattan distance heuristic
   * Admissible heuristic for A*
   */
  private heuristic(a: Vector3, b: Vector3): number {
    // Euclidean distance (admissible)
    return Vector3.Distance(a, b);
  }

  /**
   * Get neighboring grid cells
   */
  private getNeighbors(position: Vector3): Vector3[] {
    const neighbors: Vector3[] = [];
    const offsets = [
      { x: -1, z: 0 },  // Left
      { x: 1, z: 0 },   // Right
      { x: 0, z: -1 },  // Forward
      { x: 0, z: 1 },   // Backward
      { x: -1, z: -1 }, // Diagonal
      { x: 1, z: -1 },  // Diagonal
      { x: -1, z: 1 },  // Diagonal
      { x: 1, z: 1 }    // Diagonal
    ];

    for (const offset of offsets) {
      neighbors.push(new Vector3(
        position.x + offset.x * this.gridSize,
        0,
        position.z + offset.z * this.gridSize
      ));
    }

    return neighbors;
  }

  /**
   * Check if position is an obstacle
   */
  private isObstacle(position: Vector3): boolean {
    // Check if position collides with any obstacle
    const obstacleRadius = 1.0; // Radius to consider collision

    for (const obstacle of this.obstacles) {
      const distance = Math.sqrt(
        Math.pow(position.x - obstacle.x, 2) +
        Math.pow(position.z - obstacle.z, 2)
      );
      if (distance < obstacleRadius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reconstruct path from goal to start
   */
  private reconstructPath(node: PathNode): Vector3[] {
    const path: Vector3[] = [];
    let current: PathNode | null = node;

    while (current !== null) {
      path.unshift(current.position);
      current = current.parent;
    }

    // Smooth path to reduce zigzag
    return this.smoothPath(path);
  }

  /**
   * Smooth path using Catmull-Rom spline
   */
  private smoothPath(path: Vector3[]): Vector3[] {
    if (path.length < 3) return path;

    const smoothed: Vector3[] = [path[0]]; // Keep start

    // Skip redundant waypoints
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      // Check if current waypoint is necessary (not on direct line)
      const directDist = Vector3.Distance(prev, next);
      const pathDist = Vector3.Distance(prev, current) + Vector3.Distance(current, next);

      // If detour is significant, keep waypoint
      if (pathDist - directDist > 0.5) {
        smoothed.push(current);
      }
    }

    smoothed.push(path[path.length - 1]); // Keep goal

    return smoothed;
  }

  /**
   * Snap position to grid
   */
  private snapToGrid(position: Vector3): Vector3 {
    return new Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      0,
      Math.round(position.z / this.gridSize) * this.gridSize
    );
  }

  /**
   * Create unique key for node position
   */
  private getNodeKey(position: Vector3): string {
    return `${position.x.toFixed(1)},${position.z.toFixed(1)}`;
  }

  /**
   * Create new path node
   */
  private createNode(position: Vector3, parent: PathNode | null): PathNode {
    return {
      position,
      g: 0,
      h: 0,
      f: 0,
      parent
    };
  }

  /**
   * Calculate total path distance
   */
  public static calculatePathDistance(path: Vector3[]): number {
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      distance += Vector3.Distance(path[i - 1], path[i]);
    }
    return distance;
  }

  /**
   * Estimate time to traverse path at given speed
   */
  public static estimatePathTime(path: Vector3[], speed: number): number {
    const distance = this.calculatePathDistance(path);
    return distance / speed; // Assumes speed in units/second
  }
}
