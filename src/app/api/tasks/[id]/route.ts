import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status, title, description, dueDate } = await req.json();
    const resolvedParams = await params;

    const dataToUpdate: { status?: string, title?: string, description?: string, dueDate?: Date | null } = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });
    return NextResponse.json(task);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
     const resolvedParams = await params;
    await prisma.task.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
