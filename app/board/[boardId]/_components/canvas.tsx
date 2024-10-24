"use client";

import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import React, { useCallback, useMemo, useState, useEffect, } from "react";

import {
  type Camera,
  CanvasMode,
  type CanvasState,
  type Color,
  LayerType,
  type Point,
  Side,
  XYWH,
} from "@/types/canvas";
import { colorToCSS, connectionIdToColor, findIntersectingLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@/liveblocks.config";

import { CursorsPresence } from "./cursors-presence";
import { Info } from "./info";
import { LayerPreview } from "./layer-preview";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { ResetCamera } from "./reset-camera";

const MAX_LAYERS = 100;
const MULTISELECTION_THRESHOLD = 5;

type CanvasProps = {
  boardId: string;
};

export const Canvas = ({ boardId }: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0 });
  }, []);
  const [pendingLayerType, setPendingLayerType] = useState<
    LayerType.Ellipse
    | LayerType.Rectangle
    | LayerType.Text
    | LayerType.Note | null>(null);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const layerIdsRef = useStorage((root) => root.layerIds);
  const liveLayersRef = useStorage((root) => root.layers);

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType:
        | LayerType.Rectangle
        | LayerType.Ellipse
        | LayerType.Text
        | LayerType.Note,
      position: Point
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;
      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      });

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
      console.log(layerType)
    },
    [lastUsedColor]
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) return;

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer)
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelection = useMutation((
    { storage, setMyPresence },
    current: Point, origin: Point) => {
    const layers = storage.get("layers").toImmutable();
    setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    const ids = findIntersectingLayersWithRectangle(
      layerIds,
      layers,
      origin,
      current,
    );

    setMyPresence({ selection: ids });
  }, [layerIds]);

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) >
      MULTISELECTION_THRESHOLD
    ) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, event: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (
        canvasState.mode !== CanvasMode.Pencil ||
        event.buttons !== 1 ||
        !pencilDraft
      )
        return;

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
            pencilDraft[0][0] === point.x &&
            pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, event.pressure]],
      });
    },
    [canvasState.mode]
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;

      if (
        !pencilDraft ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor))
      );

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);
      setMyPresence({ pencilDraft: null });
      setCanvasState({
        mode: CanvasMode.Pencil,
      });
    },
    [lastUsedColor]
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor]
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point,
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) layer.update(bounds);
    },
    [canvasState],
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();

      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const current = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [canvasState,
      resizeSelectedLayer,
      camera,
      translateSelectedLayers,
      startMultiSelection,
      continueDrawing,
      updateSelection]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({
      cursor: null,
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);
      if (canvasState.mode === CanvasMode.Inserting) return;
      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure)
        return;
      }
      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setCanvasState, startDrawing],
  );

  const onPointerUp = useMutation(
    ({ }, e) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setCanvasState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        if (pendingLayerType) {
          insertLayer(pendingLayerType, point);
          console.log(pendingLayerType, point);
          setPendingLayerType(null); // Clear the pending type after insertion
        } else
          insertLayer(canvasState.layerType, point);
      } else {
        setCanvasState({
          mode: CanvasMode.None,
        });
      }

      history.resume();
    },
    [camera,
      setCanvasState,
      canvasState,
      unselectLayers,
      history,
      insertLayer,
      insertPath]
  );

  const selections = useOthersMapped((other) => other.presence.selection)

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) return;
      history.pause();
      e.stopPropagation();
      const point = pointerEventToCanvasPoint(e, camera);
      if (!self.presence.selection.includes(layerId))
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, history, canvasState.mode]
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};
    for (const user of selections) {
      const [connectionId, selection] = user;
      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId)
      }
    }
    return layerIdsToColorSelection;
  }, [selections])


  const duplicateLayers = useMutation(({ storage, self, setMyPresence }) => {
    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    const newLayerIds: string[] = [];
    const layersIdsToCopy = self.presence.selection;
    layersIdsToCopy.forEach((layerId) => {
      const newLayerId = nanoid();
      const layer = liveLayers.get(layerId);
      if (layer) {
        const newLayer = layer.clone();
        newLayer.set("x", newLayer.get("x") + 10);
        newLayer.set("y", newLayer.get("y") + 10);
        liveLayerIds.push(newLayerId);
        liveLayers.set(newLayerId, newLayer);
        newLayerIds.push(newLayerId);
      }
    });
    setMyPresence({ selection: [...newLayerIds] }, { addToHistory: true });
    setCanvasState({ mode: CanvasMode.None });
  }, []);

  const deleteLayers = useDeleteLayers();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "z":
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey || e.altKey) history.redo();
            else history.undo();

            break;
          }

        case "d": {
          e.preventDefault();
          if (e.ctrlKey && canvasState.mode === CanvasMode.None) duplicateLayers();
          break;
        }

        case "v":
          if (e.altKey) {
            e.preventDefault();
            if (canvasState.mode === CanvasMode.None) setCanvasState({ mode: CanvasMode.Pressing, origin: { x: 0, y: 0 } });
            else if (layerIds.some((id) => {
              const layer = liveLayersRef.get(id);
              return layer && (layer.type === LayerType.Text || layer.type === LayerType.Note);
            })) return;
            else if (canvasState.mode !== CanvasMode.Pressing) setCanvasState({ mode: CanvasMode.None });
            break;
          }
        case "p":
          if (canvasState.mode === CanvasMode.Pencil) return;
          else if (layerIds.some((id) => {
            const layer = liveLayersRef.get(id);
            return layer && (layer.type === LayerType.Text || layer.type === LayerType.Note);
          })) return;
          else setCanvasState({ mode: CanvasMode.Pencil });
          break;

        // TODO: Fix multiple calls
        case "s":
          if (e.altKey) {
            e.preventDefault();
            window.addEventListener('keydown', (event) => {
              if (!isNaN(Number(event.key))) {
                const shapeIndex = Number(event.key);
                const shapeTypes: (LayerType.Rectangle | LayerType.Ellipse | LayerType.Text | LayerType.Note)[] = [
                  LayerType.Rectangle,
                  LayerType.Ellipse,
                  LayerType.Text,
                  LayerType.Note,
                ];

                const selectedShape = shapeTypes[shapeIndex - 1];
                console.log("Selected index:", selectedShape);
                if (selectedShape) {
                  setPendingLayerType(selectedShape);
                  setCanvasState({ mode: CanvasMode.Inserting, layerType: selectedShape });
                }
              }
            });
          }
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [history,
    canvasState.mode,
    layerIds,
    setCanvasState,
    liveLayersRef,
    insertLayer]);


  return (
    <main
      className="h-full w-full relative bg-neutral-200 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
      />
      {camera.x != 0 && camera.y != 0 && <ResetCamera resetCamera={resetCamera} />}
      <SelectionTools
        onDuplicate={duplicateLayers}
        camera={camera}
        setLastUsedColor={setLastUsedColor}
        lastUsedColor={lastUsedColor}
      />

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerDown={onPointerDown}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px)`,
          }}
        >
          {layerIds.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCSS(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
    </main>
  );
};

