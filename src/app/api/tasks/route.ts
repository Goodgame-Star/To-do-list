import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, status, dueDate } = await req.json();
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return NextResponse.json(task);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
