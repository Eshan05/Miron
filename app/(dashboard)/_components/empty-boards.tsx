"use client"
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import { title } from "process";
export const EmptyBoards = () => {
  const { organization } = useOrganization();
  const create = useMutation(api.board.create);
  const onClick = () => {
    if (!organization) return;
    create({
      orgId: organization.id,
      title: "Untitled",
    })
  }
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image
        alt=""
        src={"/note.svg"}
        height={110}
        width={110} /><h2 className="text-2xl font-semibold mt-6">Create your first board</h2>
      <p className="text-sm mt-2 text-muted-foreground"> Start by creating a board for your organization</p>
      <div className="mt-6">
        <Button size={"lg"} onClick={onClick}>Create board</Button>
      </div>
    </div>
  )
}