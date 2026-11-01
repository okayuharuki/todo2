-- todos テーブルにカテゴリ列を追加（Supabase の SQL Editor で1回だけ実行）
alter table public.todos
  add column if not exists category text not null default 'その他';
