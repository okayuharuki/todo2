"use client";

import { useState, useEffect } from "react";
// 1. クォーテーションの閉じ忘れを修正
import { supabase } from "@/utils/supabase";
import { CATEGORIES, PRESET_GOALS, type Category } from "@/data/goals";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  dueDate: string;
  category?: string;
};

const MISSING_COLUMN_MESSAGE =
  "カテゴリ列がまだありません。supabase/add_category.sql を Supabase の SQL Editor で1回実行してください。";

function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-24 text-right text-xs text-zinc-400">
        {done}/{total}（{percent}%）
      </span>
    </div>
  );
}

export default function TodoApp() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const [inputText, setInputText] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [inputCategory, setInputCategory] = useState<Category>("その他");
  const [filter, setFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [notice, setNotice] = useState("");

  // 💡 ポイント①：初期状態は空の配列にしておく
  const [todos, setTodos] = useState<Todo[]>([]);

  // 💡 ポイント②：アプリが開いたときにSupabaseからデータを取ってくる
  // 💡 ポイント②：アプリが開いたときにSupabaseからデータを取ってくる
  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos") // 先ほど作成したテーブル名「todos」
        .select("*")
        .order("id", { ascending: true }); // ID順に並べる

      // 👇 ここのエラーのログ出力を詳しく書き換えます！
      if (error) {
        console.error("❌ エラーコード:", error.code);
        console.error("❌ エラー内容:", error.message);
        console.error("❌ エラー詳細:", error.details);
      } else if (data) {
        setTodos(data as Todo[]);
      }
    };

    fetchTodos();
  }, []);

  // todosを表示する前に並び替える
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }
    if (a.dueDate === "" && b.dueDate !== "") return 1;
    if (a.dueDate !== "" && b.dueDate === "") return -1;
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;
    return 0;
  });

  const categoryOf = (todo: Todo) => todo.category || "その他";

  const displayedTodos = sortedTodos.filter((todo) => {
    if (!showCompleted && todo.completed) {
      return false;
    }
    if (filter !== "all" && categoryOf(todo) !== filter) {
      return false;
    }
    return true;
  });

  // 進捗の集計
  const totalCount = todos.length;
  const doneCount = todos.filter((t) => t.completed).length;
  const stats = CATEGORIES.map((name) => {
    const items = todos.filter((t) => categoryOf(t) === name);
    return { name, total: items.length, done: items.filter((t) => t.completed).length };
  }).filter((c) => c.total > 0);

  // 目標リスト（旅行・仕事など）をまとめて読み込む。すでにあるものは追加しない
  const handleLoadPresets = async () => {
    const existing = new Set(todos.map((t) => t.text));
    const rows = PRESET_GOALS.filter((g) => !existing.has(g.text)).map((g) => ({
      text: g.text,
      completed: false,
      dueDate: "",
      category: g.category,
    }));
    if (rows.length === 0) {
      setNotice("目標リストはすべて読み込み済みです。");
      return;
    }
    const { data, error } = await supabase.from("todos").insert(rows).select();
    if (error) {
      console.error("読み込みエラー:", error);
      setNotice(error.code === "PGRST204" ? MISSING_COLUMN_MESSAGE : "読み込みに失敗しました。");
    } else if (data) {
      setTodos([...todos, ...(data as Todo[])]);
      setNotice(`${data.length}件の目標を追加しました。`);
    }
  };

  // 💡 ポイント③：リストに追加する（Supabaseに保存）
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    // Supabaseにデータを1件挿入する
    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          text: inputText,
          completed: false,
          dueDate: inputDate || "", // 空なら空文字を入れる
          category: inputCategory,
        },
      ])
      .select(); // 挿入したデータをその場で返してもらう

    if (error) {
      console.error("追加エラー:", error);
      if (error.code === "PGRST204") setNotice(MISSING_COLUMN_MESSAGE);
    } else if (data) {
      // 画面（State）にも反映する（Supabaseが自動で作った正しいIDが入る）
      setTodos([...todos, data[0] as Todo]);
      setInputText("");
      setInputDate("");
    }
  };

  // 💡 ポイント④：完了状態のトグル（Supabaseのデータを更新）
  const handleToggle = async (id: number) => {
    // 今のターゲットのタスクを探す
    const currentTodo = todos.find((t) => t.id === id);
    if (!currentTodo) return;

    // Supabaseのデータを反転させて更新
    const { error } = await supabase.from("todos").update({ completed: !currentTodo.completed }).eq("id", id); // このIDのデータだけを更新

    if (error) {
      console.error("更新エラー:", error);
    } else {
      // 画面の表示も更新
      setTodos(
        todos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
          }
          return todo;
        }),
      );
    }
  };

  // 💡 ポイント⑤：タスクを削除する（Supabaseから削除）
  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("todos").delete().eq("id", id); // このIDのデータだけを削除

    if (error) {
      console.error("削除エラー:", error);
    } else {
      // 画面の表示から消す
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">最強のTodoリスト</h1>

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">全体の進捗</h2>
          <button
            onClick={handleLoadPresets}
            className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            🎯 目標リストを読み込む
          </button>
        </div>
        <ProgressBar done={doneCount} total={totalCount} />
        <ul className="mt-4 flex flex-col gap-2">
          {stats.map((c) => (
            <li key={c.name}>
              <div className="mb-1 text-xs text-zinc-300">{c.name}</div>
              <ProgressBar done={c.done} total={c.total} />
            </li>
          ))}
        </ul>
        {notice && <p className="mt-3 text-xs text-amber-400">{notice}</p>}
      </section>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-8">
        <input
          type="text"
          placeholder="例：牛乳を買う"
          className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white placeholder-gray-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <select
          className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white"
          value={inputCategory}
          onChange={(e) => setInputCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {["all", ...CATEGORIES].map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                filter === name
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {name === "all" ? "すべて" : name}
            </button>
          ))}
        </div>
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
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
              className="w-5 h-5 cursor-pointer accent-blue-500"
            />
            <span className="text-gray-200">{todo.text}</span>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded-md px-1.5 py-0.5">
              {categoryOf(todo)}
            </span>

            {todo.dueDate &&
              (() => {
                const isOverdue = todo.dueDate < todayStr && !todo.completed;

                return (
                  <span
                    className={`text-xs px-2 py-1 rounded-md border ml-2 ${
                      isOverdue
                        ? "text-red-400 bg-red-500/10 border-red-500/20"
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
