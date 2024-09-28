"use client";

import { useCallback, useState } from "react";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { Camera, CanvasMode, CanvasState } from "@/types/canvas";
import { useCanRedo, useCanUndo, useHistory, useRedo, useMutation } from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import { pointerEventToCanvasPoint } from "@/lib/utils";

interface CanvasProps {
  boardId: string
}

export const Canvas = ({ boardId }: CanvasProps) => {
  // const info = useSelf((me) => me.info);
  // console.log(info)
  const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None, })
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 })

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY
    }));
  }, [])

  const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
    e.preventDefault();
    const current = pointerEventToCanvasPoint(e, camera);
    console.log({ current })
    setMyPresence({ cursor: current })
  }, [])
  return (
    <main className="h-[100svh] w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={false}
        canUndo={false}
        undo={history.undo}
        redo={history.redo} />
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
      >
        <g>
          <CursorsPresence />
        </g>
      </svg>
    </main>
  );
}