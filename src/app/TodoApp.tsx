"use client";

import { useState, useEffect } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  dueDate: string;
};

export default function TodoApp() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const [inputText, setInputText] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("my-todos");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem("my-todos", JSON.stringify(todos));
    }
  }, [todos]);

  // todosを表示する前に並び替える
  const sortedTodos = [...todos].sort((a, b) => {
    // 【ルール1】完了状態が違うなら、未完了（false）を上にする
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    // 【ルール2】どっちも未完了（またはどっちも完了）なら、期限日を比べる
    // 期限が設定されていないタスク（空文字）は、一番下に回す
    if (a.dueDate === "" && b.dueDate !== "") return 1;
    if (a.dueDate !== "" && b.dueDate === "") return -1;

    // 両方に期限があるなら、日付が古い（締め切りが近い）ほうを上にする
    if (a.dueDate < b.dueDate) return -1; // aを上へ
    if (a.dueDate > b.dueDate) return 1; // bを上へ

    return 0; // 同じなら順序を変えない
  });

  const displayedTodos = sortedTodos.filter((todo) => {
    if (!showCompleted && todo.completed) {
      return false;
    }
    return true;
  });

  // リストに追加する
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const newTodos: Todo = {
      id: Date.now(),
      text: inputText,
      completed: false,
      dueDate: inputDate,
    };

    setTodos([...todos, newTodos]);
    setInputText("");
    setInputDate("");
  };

  // アップデートされたTodoを受け取って、todosの状態を更新する関数
  const handleToggle = (id: number) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      }),
    );
  };
  // 🗑️ 指定したID以外のタスクだけを残す
  const handleDelete = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">最強のTodoリスト</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="例：牛乳を買う"
          className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white placeholder-gray-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <input
          type="date"
          className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white cursor-pointer"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          追加
        </button>
      </form>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl transition-colors"
        >
          {showCompleted ? "👁️ 完了タスクを隠す" : "👁️ 完了タスクを表示（復活）"}
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {displayedTodos.map((todo) => (
          <li key={todo.id} className="border-b border-zinc-800 py-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={todo.completed} // 💡 チェックの見た目を反映
              onChange={() => handleToggle(todo.id)} // 💡 クリックで関数を呼ぶ！
              className="w-5 h-5 cursor-pointer accent-blue-500"
            />
            <span className="text-gray-200">{todo.text}</span>

            {todo.dueDate &&
              (() => {
                // 「期限が設定されていて」かつ「今日より前」かつ「まだ未完了」なら期限切れ！
                const isOverdue = todo.dueDate < todayStr && !todo.completed;

                return (
                  <span
                    className={`text-xs px-2 py-1 rounded-md border ml-2 ${
                      isOverdue
                        ? "text-red-400 bg-red-500/10 border-red-500/20" // 🔴 期限切れなら赤
                        : "text-zinc-400 bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    {isOverdue ? "⚠️ 期限切れ: " : "📅 "} {todo.dueDate}
                  </span>
                );
              })()}

            <button
              onClick={() => handleDelete(todo.id)}
              className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-xl ml-auto text-sm hover:bg-red-500 hover:text-white transition-colors"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
