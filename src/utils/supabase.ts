import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 鍵が万が一見つからない場合はエラーを出す（安全のため）
if (!supabaseUrl || !supabaseKey) {
  throw new Error("SupabaseのURLまたはKeyが設定されていません。");
}

// 2つの鍵を使って、Supabase専用の通信窓口（クライアント）を合体させて作成！
export const supabase = createClient(supabaseUrl, supabaseKey);