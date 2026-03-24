'use client';

import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const LOCAL_STORAGE_KEY = 'my-todo-list-todos';

export default function Home() {
  // 1. KITA UBAH BAGIAN INI: Selalu mulai dengan array kosong
  // Ini memastikan server dan client render hal yang sama pada awalnya.
  const [todos, setTodos] = useState<Todo[]>([]);

  // 2. KITA TAMBAHKAN useEffect BARU INI
  // useEffect ini hanya berjalan satu kali di sisi client setelah komponen dimuat.
  // Tujuannya adalah untuk mengambil data dari localStorage.
  useEffect(() => {
    const savedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []); // <-- Dependency array kosong berarti "jalankan sekali saja saat awal"

  // 3. useEffect untuk MENYIMPAN data tetap sama
  // useEffect ini berjalan setiap kali state 'todos' berubah.
  useEffect(() => {
    // Pengecekan ini untuk memastikan kita tidak menyimpan array kosong saat pertama kali render
    if (todos.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos]);


  const handleAddTodo = () => {
    if (input.trim() !== '') {
      const newTodo: Todo = {
        id: Date.now(), 
        text: input,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInput('');
    }
  };

  const [input, setInput] = useState<string>('');

  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: number) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    // Jika setelah dihapus tidak ada todos lagi, hapus juga dari local storage
    if (updatedTodos.length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-900 text-white">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-center">To-do List</h1>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apa Kegiatan Mu Hari ini ?"
            className="flex-grow p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTodo}
            className="bg-blue-600 hover:bg-blue-700 p-2 px-4 rounded font-semibold"
          >
            Tambah
          </button>
        </div>
        
        <div className="space-y-2">
          {todos.map(todo => (
            <div 
              key={todo.id} 
              className="flex items-center justify-between bg-gray-800 p-3 rounded hover:bg-gray-700 transition-colors"
            >
              <span 
                className={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}
                onClick={() => handleToggleTodo(todo.id)}
              >
                {todo.text}
              </span>
              <button 
                onClick={() => handleDeleteTodo(todo.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}