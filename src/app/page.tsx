// 【おまじない】このファイルはユーザーのブラウザ上で動く画面（クライアント）ですよと宣言
"use client";

// 【道具の準備】Reactが用意している「記憶の箱（useState）」と「見張り番（useEffect）」を取り寄せる
import { useState, useEffect } from "react";

// 【ルール（設計図）】これから扱う「Todoカード」は、この3つのデータを持つというルール
type Todo = {
  id: number; // 出席番号（Date.now()で作る、絶対に被らない数字）
  text: string; // タスクの内容（例："牛乳を買う"）
  completed: boolean; // 完了したかどうかの印（true: 完了 / false: 未完了）
};

// 【メインの劇のスタート】TodoAPPという画面の仕組みをここから書く
export default function TodoAPP() {
  // ==========================================
  // 📦 1. 記憶の箱（State）の準備
  // ==========================================

  // ① 入力中の文字を一時的に覚えておく「下書き用紙」
  const [inputText, setInputText] = useState("");

  // ② 完成したTodoカードを並べておくメインの「コルクボード」
  const [todos, setTodos] = useState<Todo[]>([]);

  // ==========================================
  // 👁️ 2. 見張り番（Effect）の準備：LocalStorage（秘密のノート）
  // ==========================================

  // 【見張り番1：画面が開いた最初の1回だけ動く】
  // 秘密のノート（localStorage）から前回保存したデータを読み込んで、コルクボードに貼る！
  useEffect(() => {
    const savedTodos = localStorage.getItem("my-todos");
    // もしノートにデータ（文字）が残っていたら…
    if (savedTodos) {
      // JSON.parse で「ただの文字」から「Todoの配列」に翻訳して、コルクボードに入れる
      setTodos(JSON.parse(savedTodos));
    }
  }, []); // ← 空の [] は「最初の1回だけ」という合図

  // 【見張り番2：コルクボード（todos）の中身が変わるたびに動く】
  // 追加・削除・チェックなどでデータが変わったら、忘れずにノートに上書き保存する！
  useEffect(() => {
    // JSON.stringify で「Todoの配列」を「ただの文字」に翻訳して、ノートに書き込む
    localStorage.setItem("my-todos", JSON.stringify(todos));
  }, [todos]); // ← [todos] は「todosが変わるたび」という合図

  // ==========================================
  // ⚙️ 3. 裏側の仕組み（関数）の準備
  // ==========================================

  // ➕ 【Create】追加ボタンが押された時の処理
  const handleAdd = () => {
    // もし下書きが空っぽ（""）なら、何もしない（ガードマン）
    if (inputText === "") return;

    // 下書きの文字を使って、新しい「Todoカード」を作る
    const newTodo: Todo = {
      id: Date.now(), // 今の時間をIDにして、絶対に被らないようにする
      text: inputText, // 下書きの文字を書き写す
      completed: false, // 追加したてなので「未完了（false）」
    };

    // スプレッド構文（...）で古いカードを全部広げ、後ろに新しいカードを足して上書き！
    setTodos([...todos, newTodo]);

    // 次の入力のために、下書き用紙を真っ白に戻す
    setInputText("");
  };

  // 🔄 【Update】チェックボックスが押された時の処理（idを受け取る）
  const handleToggle = (id: number) => {
    // map（コンベア）で全員のカードを1枚ずつ点検する
    const updatedTodos = todos.map((todo) => {
      // もし「流れてきたID」と「クリックされたID」が同じなら…
      if (todo.id === id) {
        // カードをコピー（...todo）して、完了印だけを「逆（!）」にした新しいカードを作る！
        return { ...todo, completed: !todo.completed };
      }
      // 違うカードなら、何もいじらずにそのまま流す
      return todo;
    });
    // 出来上がった新しいカード群で上書き！
    setTodos(updatedTodos);
  };

  // 🗑️ 【Delete 1】各タスクの「削除」ボタンが押された時の処理（idを受け取る）
  const handleDelete = (id: number) => {
    // filter（ザル）を使って、「クリックされたIDとは違う（!==）」カードだけを残す！
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };

  // 🧹 【Delete 2】「完了済みをすべて削除」ボタンが押された時の処理
  const handleClearCompleted = () => {
    // filter（ザル）を使って、「未完了（!todo.completed）」のカードだけを残す！
    // （※完了しているカードはザルの目から落ちて消える）
    const newTodos = todos.filter((todo) => !todo.completed);
    setTodos(newTodos);
  };

  // ==========================================
  // 🖥️ 4. 画面（UI）の組み立て
  // ==========================================
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">最強のToDoリスト</h1>

      {/* ✏️ 入力エリア */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="例：牛乳を買う"
          className="border p-2 flex-1 rounded"
          value={inputText} // 下書き用紙の文字を表示
          onChange={(e) => setInputText(e.target.value)} // キーボードを打つたびに下書きを更新
        />
        <button
          onClick={handleAdd} // クリックで「追加の仕組み」を呼ぶ
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          追加
        </button>
      </div>

      {/* 📋 リスト表示エリア（Read） */}
      <ul className="mt-4">
        {/* コルクボード（todos）の中身を1枚ずつ取り出して、<li>の形にする */}
        {todos.map((todo) => (
          // key には、絶対に被らない todo.id を指定する
          <li key={todo.id} className="border-b py-2 flex items-center gap-2">
            {/* チェックボックス */}
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)} // クリックで「チェック切替の仕組み」を呼ぶ
              className="w-5 h-5 cursor-pointer"
            />

            {/* テキスト（completedがtrueなら取り消し線とグレー色にする） */}
            <span className={todo.completed ? "line-through text-gray-400" : ""}>{todo.text}</span>

            {/* 1件削除ボタン */}
            <button
              onClick={() => handleDelete(todo.id)} // クリックで「1件削除の仕組み」を呼ぶ
              className="bg-red-500 text-white px-2 py-1 rounded ml-auto text-sm hover:bg-red-600"
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      {/* 🧹 お掃除ボタンエリア */}
      <div className="mt-6 text-right">
        <button
          onClick={handleClearCompleted} // クリックで「お掃除の仕組み」を呼ぶ
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          完了済みをすべて削除
        </button>
      </div>
    </div>
  );
}
