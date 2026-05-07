import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
  });

  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-3.5-turbo if you prefer
      messages: [
        {
          role: "system",
          content: `You are an intelligent task planner assistant.
          The user will give you a prompt describing tasks they want to do, possibly recurring or spanning multiple days.
          Your job is to generate a JSON array of tasks.
          Today is ${new Date().toISOString()}.

          Respond ONLY with a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
          Each object must match this schema:
          {
            "title": "String, clear and concise task title",
            "description": "String, optional details about the task",
            "dueDate": "ISO 8601 Date String (e.g., '2023-10-25T09:00:00Z'), calculate this based on the user's prompt relative to today. It can be null if no date is implied."
          }`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || "[]";
    let generatedTasks = [];

    try {
        // Strip out possible markdown wrappers if the model misbehaves
        const cleanedContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
        generatedTasks = JSON.parse(cleanedContent);
    } catch(e: unknown) {
        console.error("Failed to parse AI response:", responseContent, e);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save tasks to database
    if (Array.isArray(generatedTasks) && generatedTasks.length > 0) {
      const createdTasks = await Promise.all(
        generatedTasks.map((task: { title: string, description?: string, dueDate?: string }) =>
          prisma.task.create({
            data: {
              title: task.title,
              description: task.description || null,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              status: "TODO"
            }
          })
        )
      );
      return NextResponse.json({ success: true, count: createdTasks.length, tasks: createdTasks });
    }

    return NextResponse.json({ success: false, message: "No tasks generated" }, { status: 400 });

  } catch (error: unknown) {
    console.error("AI Task Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
