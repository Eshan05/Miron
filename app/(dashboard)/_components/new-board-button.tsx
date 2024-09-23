"use client";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";


interface NewBoardButtonProps {
  disabled?: boolean;
  orgId: string;
};

export const NewBoardButton = ({
  orgId,
  disabled,
}: NewBoardButtonProps) => {
  return (
    <button
      disabled={disabled}
      onClick={() => { }}
      className={cn(
        "col-span-1 aspect-[100/127] bg-blue-600 rounded-lg hover:bg-blue-800 flex flex-col items-center justify-center py-6"
      )}
    >
      <Plus className="h-12 text-white w-12 stroke-1" />
      <p className="text-sm text-white font-light">New Board</p>
    </button>
  )
};