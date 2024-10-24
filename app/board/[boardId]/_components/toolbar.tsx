"use client";

import { useEffect } from "react";
import { useSelf } from "@/liveblocks.config";
import {
  Circle,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
} from "lucide-react";
import { CanvasMode, LayerType, type CanvasState } from "@/types/canvas";
import { ToolButton } from "./tool-button";

type ToolbarProps = {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canRedo,
  canUndo,
}: ToolbarProps) => {
  const selection = useSelf((me) => me.presence.selection);
  //? The fucking rectangle still doesn't work
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selection?.length > 0) return;
      let altSPressed = false;

      switch (e.key) {
        case "i":
          if (e.altKey) {
            e.preventDefault();
            altSPressed = true;
            console.log("Alt+I pressed.");
          }
          break;
        case "1":
          if (altSPressed) {
            e.preventDefault();
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Rectangle,
            });
            altSPressed = false;
          }
          break;
        default:
          altSPressed = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selection, setCanvasState]);
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-2 flex-col items-center shadow-md">
        <ToolButton
          label=<div className="flex items-center">Select<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">ALT + V</kbd></div>
          icon={MousePointer2}
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing
          }
        />

        <ToolButton
          label=<div className="flex items-center">Text<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">ALT + S 3</kbd></div>
          icon={Type}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Text
          }
        />

        <ToolButton
          label={<div className="flex items-center">Sticky Note<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">ALT + S 4</kbd></div>}
          icon={StickyNote}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Note,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Note
          }
        />

        <ToolButton
          label={<div className="flex items-center">Rectangle<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">ALT + S 1</kbd></div>}
          icon={Square}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Rectangle,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Rectangle
          }
        />

        <ToolButton
          label={<div className="flex items-center">Ellipse<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">ALT + S 2</kbd></div>}
          icon={Circle}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Ellipse,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Ellipse
          }
        />

        <ToolButton
          label={<div className="flex items-center">Pen<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">P</kbd></div>}
          icon={Pencil}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Pencil,
            })
          }
          isActive={canvasState.mode === CanvasMode.Pencil}
        />
      </div>

      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton
          label=<div className="flex items-center">Undo<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">CTRL + Z</kbd></div>
          icon={Undo2}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label={<div className="flex items-center">Redo<kbd className="text-center font-mono px-2 py-1 rounded ml-2 font-semibold inline-block bg-neutral-600/60 !text-xs opacity-80">CTRL + ALT + Z</kbd></div>}
          icon={Redo2}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
    </div>
  );
};

export const ToolbarSkeleton = () => {
  return (
    <div
      className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md"
      aria-hidden
    />
  );
};