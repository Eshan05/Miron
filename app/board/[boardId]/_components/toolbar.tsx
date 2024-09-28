import { Circle, MousePointer2, Pen, Redo2, Square, StickyNoteIcon, Type, Undo2 } from "lucide-react";
import { ToolButton } from "./tool-button";
import { CanvasMode, CanvasState } from "@/types/canvas";

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
  canUndo,
  canRedo,
}: ToolbarProps) => {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton label="Select" icon={MousePointer2} onClick={() => setCanvasState({ mode: CanvasMode.None })} isActive={canvasState.mode === CanvasMode.None} />
        <ToolButton label="Type" icon={Type} onClick={() => { }} isActive={false} />
        <ToolButton label="Sticky Note" icon={StickyNoteIcon} onClick={() => { }} isActive={false} />
        <ToolButton label="Rectangle" icon={Square} onClick={() => { }} isActive={false} />
        <ToolButton label="Ellipse" icon={Circle} onClick={() => { }} isActive={false} />
        <ToolButton label="Pen" icon={Pen} onClick={() => { }} isActive={false} />
      </div>
      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
        <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
      </div>
    </div>
  );
}

export const ToolbarSkeleton = () => {
  return (
    <div
      className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md"
      aria-hidden
    />
  );
};