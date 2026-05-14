"use client";

import dynamic from "next/dynamic";

const CustomerSupport = dynamic(() => import("./CustomerSupport"), {
  ssr: false,
});

// This wrapper exists to apply { ssr: false } to CustomerSupport.
// CustomerSupport uses useTranslation(), which causes hydration mismatch when server-rendered.
// dynamic() with ssr: false can only be used inside a Client Component, not a Server Component (page),
// so this file acts as a Client Component bridge.
//
// 这个 wrapper 的作用是对 CustomerSupport 应用 { ssr: false }。
// CustomerSupport 使用了 useTranslation()，服务端渲染会导致 hydration mismatch。
// dynamic() 加 ssr: false 只能在 Client Component 里使用，page 是 Server Component，
// 所以需要这个文件作为客户端组件的中转层。
//
// No locale prop — this section is below the fold, so useTranslation() initializes before the user sees it.
// Above-fold components (Header, FAQ, Footer) use manual JSON lookup to avoid FOUC during SSR.
// 没有 locale prop —— 该区块在首屏以下，用户看到时 i18next 已完成初始化，不会出现内容闪烁。
// 首屏组件（Header、FAQ、Footer）改用手动 JSON 查表，避免 SSR 期间的 FOUC。
export default function CustomerSupportClient() {
  return <CustomerSupport />;
}
