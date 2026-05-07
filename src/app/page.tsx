"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock, MoreHorizontal, Sparkles, Trash } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  createdAt: string;
};

const COLUMNS = [
  { id: "TODO", title: "TO DO", color: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "IN PROGRESS", color: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  { id: "DONE", title: "DONE", color: "bg-green-50 text-green-600", dot: "bg-green-500" },
] as const;

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState("");
  const [, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
    setIsLoading(false);
  };

  const addTask = async (title: string, status = "TODO") => {
    if (!title.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status }),
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus as "TODO" | "IN_PROGRESS" | "DONE" } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update status", error);
      fetchTasks(); // Revert on fail
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete task", error);
      fetchTasks();
    }
  };

  const generateTasksWithAI = async () => {
    if (!prompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        setPrompt("");
        fetchTasks(); // Refresh to show new AI generated tasks
      }
    } catch (error) {
      console.error("AI Error", error);
    }
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            T
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        </div>
        
        {/* AI Prompt Input */}
        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateTasksWithAI()}
              placeholder="Ask AI to plan your tasks (e.g., 'Plan running schedule for 3 days')"
              className="block w-full pl-10 pr-24 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm shadow-sm"
              disabled={isAiLoading}
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center">
               <button
                  onClick={generateTasksWithAI}
                  disabled={isAiLoading || !prompt.trim()}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                 {isAiLoading ? "Thinking..." : "Generate"}
               </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Add user avatar or settings here if needed */}
           <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </header>

      {/* Board */}
      <main className="p-6 h-[calc(100vh-73px)] overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col flex-shrink-0">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-sm text-slate-700">{col.title}</h3>
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-hide">
                  {/* Quick Add Task */}
                  {col.id === "TODO" && (
                    <div className="group cursor-pointer">
                      <input
                        type="text"
                        placeholder="Add new task..."
                        className="w-full text-sm py-2 px-3 bg-transparent border-2 border-dashed border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-indigo-50/30 transition-all placeholder:text-slate-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addTask(e.currentTarget.value, col.id);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  )}

                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className={`text-sm font-medium leading-snug ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.title}
                        </p>
                         <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                          >
                           <Trash className="w-4 h-4" />
                         </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          {task.dueDate && (
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                              new Date(task.dueDate) < new Date() && task.status !== "DONE"
                                ? "bg-red-50 text-red-600"
                                : "bg-slate-50 text-slate-500"
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(task.dueDate), "MMM d")}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Mover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.id !== "TODO" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "TODO")}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Move to To Do"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                           {col.id !== "IN_PROGRESS" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                               title="Move to In Progress"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          {col.id !== "DONE" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "DONE")}
                              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                               title="Mark as Done"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
