/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 ここからセキュリティヘッダーの設定を追加
  async headers() {
    return [
      {
        // すべてのページ（URL）にこの防犯ルールを適用するよという意味
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // 自分のサイト以外での埋め込みを禁止
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // ファイルタイプの偽装を防止
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // どこからリンクを踏んだかの情報を守る
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // 無駄なカメラやマイクの機能をアプリで禁止する
          },
          // 💡 ※CSPは設定が非常に細かいため、まずはこの4つを入れるだけでセキュリティの点数が爆上がりします！
        ],
      },
    ];
  },
};

export default nextConfig;
