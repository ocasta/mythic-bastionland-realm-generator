import { useState, useCallback } from "react";
import { hexUtils } from "../utils/hexUtils";

/**
 * Find if an endpoint touches another river (making it a tributary)
 * @param {Object} endpoint - Point {row, col, corner?}
 * @param {Array} rivers - Array of river objects
 * @param {string|null} excludeId - River ID to exclude from search
 * @returns {string|null} ID of the parent river, or null if not a tributary
 */
const findTributaryParent = (endpoint, rivers, excludeId = null) => {
  for (const river of rivers) {
    if (river.id === excludeId) continue;
    if (river.hasPoint(endpoint.row, endpoint.col, endpoint.corner ?? null) ||
        river.hasPointAtHex(endpoint.row, endpoint.col)) {
      return river.id;
    }
  }
  return null;
};

/**
 * Custom hook for river drawing functionality
 * Handles river path creation, tributary detection, selection, and drag-to-reroute
 */
export function useRiverDrawing({ realm, setRealm, setPaintingMode, setSelectedTerrainType, setSelectedHex }) {
  const [riverDrawingMode, setRiverDrawingMode] = useState(false);
  const [currentRiverPath, setCurrentRiverPath] = useState([]);

  // River selection state
  const [selectedRiverId, setSelectedRiverId] = useState(null);

  // Drag state for rerouting
  const [draggingWaypoint, setDraggingWaypoint] = useState(null); // {riverId, pointIndex, originalPoint}
  const [dragPreviewPoint, setDragPreviewPoint] = useState(null); // {row, col, corner?, isValid}
  const [dragPaths, setDragPaths] = useState(null); // {pathToPrev, pathToNext} - computed paths for insertion

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // {riverId, pointIndex, x, y}

  const startRiverDrawing = useCallback(() => {
    setRiverDrawingMode(true);
    setCurrentRiverPath([]);
    setPaintingMode(); // This is actually resetPaintingState
    setSelectedHex(null);
    setSelectedRiverId(null);
    setDraggingWaypoint(null);
    setDragPreviewPoint(null);
  }, [setPaintingMode, setSelectedHex]);

  const addRiverPoint = useCallback((row, col, corner = null) => {
    const newPoint = { row, col };
    if (corner !== null && corner !== undefined) {
      newPoint.corner = corner;
    }

    setCurrentRiverPath(prev => {
      // If this is not the first point, check adjacency
      if (prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        const isAdjacent = hexUtils.arePointsAdjacent(lastPoint, newPoint, realm.rows, realm.cols);

        if (!isAdjacent) {
          return prev; // Ignore non-adjacent clicks
        }

        // Don't allow revisiting the exact same point
        const isDuplicate = prev.some(p =>
          p.row === row && p.col === col &&
          (!hexUtils.isCornerPoint(p) && (corner === undefined || corner === null) ||
           p.corner === corner)
        );
        if (isDuplicate) {
          return prev;
        }
      }

      return [...prev, newPoint];
    });
  }, [realm.rows, realm.cols]);

  const finishRiver = useCallback(() => {
    if (currentRiverPath.length >= 2) {
      const newRealm = realm.copy();
      const lastPoint = currentRiverPath[currentRiverPath.length - 1];
      const tributaryOf = findTributaryParent(lastPoint, newRealm.rivers);

      newRealm.addRiver([...currentRiverPath], tributaryOf);
      setRealm(newRealm);
    }

    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  }, [currentRiverPath, realm, setRealm]);

  const cancelRiver = useCallback(() => {
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  }, []);

  const removeRiver = useCallback((id) => {
    const newRealm = realm.copy();
    newRealm.removeRiver(id);
    setRealm(newRealm);
  }, [realm, setRealm]);

  const resetRiverState = useCallback(() => {
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
    setSelectedRiverId(null);
    setDraggingWaypoint(null);
    setDragPreviewPoint(null);
    setDragPaths(null);
    setContextMenu(null);
  }, []);

  // River selection functions
  const selectRiver = useCallback((riverId) => {
    setSelectedRiverId(riverId);
    setSelectedHex(null);
    setPaintingMode(); // This is actually resetPaintingState
  }, [setSelectedHex, setPaintingMode]);

  const deselectRiver = useCallback(() => {
    setSelectedRiverId(null);
    setDraggingWaypoint(null);
    setDragPreviewPoint(null);
    setDragPaths(null);
    setContextMenu(null);
  }, []);

  // Drag-to-reroute functions
  const startWaypointDrag = useCallback((riverId, pointIndex) => {
    const river = realm.rivers.find(r => r.id === riverId);
    if (!river || pointIndex < 0 || pointIndex >= river.path.length) return;

    const originalPoint = { ...river.path[pointIndex] };
    setDraggingWaypoint({ riverId, pointIndex, originalPoint });
    setDragPreviewPoint({ ...originalPoint, isValid: true });
    setDragPaths(null);
  }, [realm.rivers]);

  const updateWaypointDrag = useCallback((worldX, worldY) => {
    if (!draggingWaypoint) return;

    const river = realm.rivers.find(r => r.id === draggingWaypoint.riverId);
    if (!river) return;

    // Convert world coordinates to nearest river point (center or corner)
    const point = hexUtils.worldToRiverPoint(worldX, worldY, realm.rows, realm.cols);
    if (!point) {
      setDragPreviewPoint(prev => prev ? { ...prev, isValid: false } : null);
      setDragPaths(null);
      return;
    }

    const newPoint = { row: point.row, col: point.col };
    if (point.corner !== undefined) {
      newPoint.corner = point.corner;
    }
    const { pointIndex } = draggingWaypoint;

    // Find paths to previous and next points using pathfinding
    let pathFromPrev = null;
    let pathToNext = null;
    let isValid = true;

    if (pointIndex > 0) {
      const prevPoint = river.path[pointIndex - 1];
      pathFromPrev = hexUtils.findRiverPath(prevPoint, newPoint, realm.rows, realm.cols);
      if (!pathFromPrev) {
        isValid = false;
      }
    }

    if (isValid && pointIndex < river.path.length - 1) {
      const nextPoint = river.path[pointIndex + 1];
      pathToNext = hexUtils.findRiverPath(newPoint, nextPoint, realm.rows, realm.cols);
      if (!pathToNext) {
        isValid = false;
      }
    }

    setDragPreviewPoint({ ...newPoint, isValid });
    setDragPaths(isValid ? { pathFromPrev, pathToNext } : null);
  }, [draggingWaypoint, realm.rivers, realm.rows, realm.cols]);

  const endWaypointDrag = useCallback(() => {
    if (!draggingWaypoint || !dragPreviewPoint) {
      setDraggingWaypoint(null);
      setDragPreviewPoint(null);
      setDragPaths(null);
      return;
    }

    if (dragPreviewPoint.isValid && dragPaths) {
      const newRealm = realm.copy();
      const river = newRealm.rivers.find(r => r.id === draggingWaypoint.riverId);

      if (river) {
        const { pointIndex } = draggingWaypoint;
        const { pathFromPrev, pathToNext } = dragPaths;

        // Build the new path by replacing the single point with the computed paths
        const newPath = [];

        // Add points before the dragged point
        for (let i = 0; i < pointIndex; i++) {
          newPath.push(river.path[i]);
        }

        // Add path from previous point to new position (skip first point as it's the prev point)
        if (pathFromPrev && pathFromPrev.length > 1) {
          for (let i = 1; i < pathFromPrev.length; i++) {
            newPath.push(pathFromPrev[i]);
          }
        } else {
          // No path needed (first point or adjacent)
          const newPoint = { row: dragPreviewPoint.row, col: dragPreviewPoint.col };
          if (dragPreviewPoint.corner !== undefined) {
            newPoint.corner = dragPreviewPoint.corner;
          }
          newPath.push(newPoint);
        }

        // Add path from new position to next point (skip first point as it's the new position, already added)
        if (pathToNext && pathToNext.length > 1) {
          for (let i = 1; i < pathToNext.length - 1; i++) {
            newPath.push(pathToNext[i]);
          }
        }

        // Add points after the dragged point
        for (let i = pointIndex + 1; i < river.path.length; i++) {
          newPath.push(river.path[i]);
        }

        river.path = newPath;

        // If we moved an endpoint, check tributary status
        const newEndpoint = newPath[newPath.length - 1];
        const wasEndpoint = pointIndex === river.path.length - 1 || pointIndex === draggingWaypoint.pointIndex;
        if (wasEndpoint || newPath.length !== river.path.length) {
          river.tributaryOf = findTributaryParent(newEndpoint, newRealm.rivers, river.id);
        }

        setRealm(newRealm);
      }
    }

    setDraggingWaypoint(null);
    setDragPreviewPoint(null);
    setDragPaths(null);
  }, [draggingWaypoint, dragPreviewPoint, dragPaths, realm, setRealm]);

  const cancelWaypointDrag = useCallback(() => {
    setDraggingWaypoint(null);
    setDragPreviewPoint(null);
    setDragPaths(null);
  }, []);

  // Context menu functions
  const openContextMenu = useCallback((riverId, pointIndex, x, y) => {
    setContextMenu({ riverId, pointIndex, x, y });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const deleteWaypoint = useCallback(() => {
    if (!contextMenu) return;

    const { riverId, pointIndex } = contextMenu;
    const river = realm.rivers.find(r => r.id === riverId);
    if (!river) {
      closeContextMenu();
      return;
    }

    // Can't delete if river would have less than 2 points
    if (river.path.length <= 2) {
      closeContextMenu();
      return;
    }

    const newRealm = realm.copy();
    const newRiver = newRealm.rivers.find(r => r.id === riverId);

    // Check if deleting this point would break adjacency
    const isFirst = pointIndex === 0;
    const isLast = pointIndex === river.path.length - 1;

    if (!isFirst && !isLast) {
      // Middle point - check if prev and next are adjacent or can be connected
      const prevPoint = river.path[pointIndex - 1];
      const nextPoint = river.path[pointIndex + 1];

      if (!hexUtils.arePointsAdjacent(prevPoint, nextPoint, realm.rows, realm.cols)) {
        // Try to find a path between them
        const bridgePath = hexUtils.findRiverPath(prevPoint, nextPoint, realm.rows, realm.cols);
        if (bridgePath && bridgePath.length > 0) {
          // Replace the point with the bridge path (excluding endpoints which are already in the path)
          const newPath = [
            ...river.path.slice(0, pointIndex),
            ...bridgePath.slice(1, -1), // intermediate points only
            ...river.path.slice(pointIndex + 1)
          ];
          newRiver.path = newPath;
        } else {
          // Can't connect - don't delete
          closeContextMenu();
          return;
        }
      } else {
        // Adjacent - just remove the point
        newRiver.path = [
          ...river.path.slice(0, pointIndex),
          ...river.path.slice(pointIndex + 1)
        ];
      }
    } else {
      // First or last point - just remove it
      newRiver.path = [
        ...river.path.slice(0, pointIndex),
        ...river.path.slice(pointIndex + 1)
      ];

      // If we removed the last point, check tributary status
      if (isLast && newRiver.path.length > 0) {
        const newEndpoint = newRiver.path[newRiver.path.length - 1];
        newRiver.tributaryOf = findTributaryParent(newEndpoint, newRealm.rivers, riverId);
      }
    }

    setRealm(newRealm);
    closeContextMenu();
  }, [contextMenu, realm, setRealm, closeContextMenu]);

  return {
    riverDrawingMode,
    currentRiverPath,
    startRiverDrawing,
    addRiverPoint,
    finishRiver,
    cancelRiver,
    removeRiver,
    resetRiverState,
    // Selection
    selectedRiverId,
    selectRiver,
    deselectRiver,
    // Drag-to-reroute
    draggingWaypoint,
    dragPreviewPoint,
    dragPaths,
    startWaypointDrag,
    updateWaypointDrag,
    endWaypointDrag,
    cancelWaypointDrag,
    // Context menu
    contextMenu,
    openContextMenu,
    closeContextMenu,
    deleteWaypoint,
  };
}

export default useRiverDrawing;
