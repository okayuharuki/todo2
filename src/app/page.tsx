"use client";

import dynamic from "next/dynamic";

const TodoApp = dynamic(() => import("./TodoApp"), { ssr: false });

export default function page() {
  return <TodoApp />;
}
