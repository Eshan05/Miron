"use client";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/convex/_generated/api";

interface ActionProps {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  title: string;
  id: string;
};

export const Actions = ({ children, side, sideOffset, title, id }: ActionProps) => {
  const { mutate, pending } = useApiMutation(api.board.remove);
  const onCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/board/${id}`
    )
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Failed to copy link"))
  }

  const onDelete = () => {
    mutate({ id })
      .then(() => toast.success("Board deleted"))
      .catch(() => toast.error("Failed to delete board"))
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} sideOffset={sideOffset} className="w-60" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className="p-3 cursor-pointer" onClick={onCopyLink}>
          <Link2 className="h-4 w-4 mr-2" /> Copy Board Link
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete Board
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}