# 架构说明

> 写给未来的自己或新人：解释这个项目为什么这样组织，以及每一个"奇怪"的决定背后的原因。

---

## 1. 部署方式：纯静态 HTML

```
next build  →  出/out 文件夹（纯 HTML/CSS/JS 文件）
               ↓
           Docker 镜像（Nginx 直接 serve 静态文件）
               ↓
           AWS EKS（Kubernetes Pod）
               ↓
           CloudFront CDN（/tracking/* 路由到这个集群）
               ↓
           用户浏览器
```

关键配置在 `next.config.ts`：

```ts
output: 'export'   // 告诉 Next.js：只输出静态文件，不要 Node.js 服务
```

**这意味着什么：**
- 没有 Node.js 服务器在线上运行
- 所有页面在 `npm run build` 时就已经生成为 `.html` 文件
- Nginx 只是把这些文件发给浏览器，和发 `.jpg` 图片一样简单
- 因此：**不存在"服务端渲染（SSR）运行时"**，有的只是"构建时预渲染（SSG）"

---

## 2. SSG vs SSR vs CSR：我们只用 SSG

| 术语 | 全称 | 发生时间 | 我们用了吗 |
|------|------|----------|------------|
| SSR | Server-Side Rendering | 每次请求时，Node.js 实时生成 HTML | ❌ 没有（output: export 不支持） |
| SSG | Static Site Generation | `npm run build` 时，一次性生成所有 HTML | ✅ 是的，所有页面 |
| CSR | Client-Side Rendering | 浏览器收到空 HTML 后，JS 执行再渲染 | ⚠️ 部分组件（见下文） |

**实际效果：**  
用户访问 `/tracking/` → CloudFront 返回 build 时就生成好的 `index.html`，里面已经有 h1、FAQ、Footer 的完整文字 → 浏览器显示内容 → React 在后台"接管"（hydration）→ 页面变得可交互。

---

## 3. React 的两种组件类型

Next.js App Router 中每个组件要么是 **Server Component**，要么是 **Client Component**。

### Server Component（默认）

```tsx
// 没有 'use client' → Server Component
export default function FAQ({ locale }: { locale: 'en' | 'fr' }) {
  // 这里的代码只在 build 时运行一次，生成静态 HTML
  // 不能用 useState、useEffect、浏览器 API
}
```

- 只在 **build 时** 执行（对我们来说等同于 SSG）
- 生成的 HTML 直接写进 `.html` 文件
- 运行时浏览器**不会**下载或执行这个组件的 JS
- FAQ、Footer、Header 都是这种 → 内容立刻出现在 HTML 里，对 LCP 最友好

### Client Component

```tsx
'use client'  // 文件顶部加这行 → Client Component

export default function FAQItem() {
  const [open, setOpen] = useState(false)  // 可以用 hooks
}
```

- Build 时 Next.js **也会**预渲染它的 HTML（SSG），但同时会把 JS bundle 打进去
- 浏览器加载后，React 会"hydrate"：把 JS 事件绑定到已有的 HTML 上
- 可以用 useState、useEffect、DOM API

---

## 4. 多语言：为什么部分组件不用 `useTranslation`

项目原本全部使用 `react-i18next` 的 `useTranslation()`，但这引发了严重问题。

### 问题：Hydration Mismatch

```
Build 时（no window）: i18n 默认语言 = 'en' → 生成法语页面的 HTML 时，写入了英文
浏览器加载后:          i18n 检测到 URL 是 /fr/suivi/ → 切换为法语
结果: HTML 里是英文，React 想渲染法语 → React 报错 "hydration mismatch"
```

### 解决方案：首屏可见组件改用 locale prop + 直接 JSON import

```tsx
// ❌ 旧方式 - 依赖运行时语言检测
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()  // build 时不知道语言是 en 还是 fr

// ✅ 新方式 - build 时就确定语言
import en from '@/lib/i18n/locales/en.json'
import fr from '@/lib/i18n/locales/fr.json'
const t = translations[locale]  // locale 由 page.tsx 传入，build 时已知
```

语言从 page.tsx 一路向下传递：

```
app/(fr)/fr/suivi/page.tsx  locale="fr"
  └── TrackingHero locale="fr"
        └── PageContent locale="fr"
              ├── TrackingApp locale="fr"
              │     └── TrackingInput locale="fr"  ← 首屏输入框
              └── (h1 标题)
  └── Header locale="fr"   ← 导航栏
  └── FAQ locale="fr"      ← 问答区
  └── Footer locale="fr"   ← 页脚
```

### 哪些组件保留了 `useTranslation`

只有**用户交互后才出现**的组件保留旧方式（它们不影响 LCP，也不参与首次 hydration）：

| 组件 | 原因 |
|------|------|
| `TrackingResults` | 点击 Track 后才显示 |
| `ResultCard` | 同上 |
| `ExportTable` | 同上 |
| `ZipModal` / `PodModal` / `NoticeModal` | 弹窗，用户操作才触发 |
| `Loader` | 加载中遮罩，查询时才显示 |
| `CookieBanner` | 只在没有 cookie 时显示，完全客户端 |
| `CustomerSupport` | 见下文 |

### CustomerSupport 的特殊处理

`CustomerSupport` 使用了 `useTranslation` 且内部有表单逻辑，迁移成本高。为防止它在法语页面 hydration mismatch，用 `ssr: false` 完全跳过预渲染：

```tsx
// CustomerSupportClient.tsx
const CustomerSupport = dynamic(() => import('./CustomerSupport'), { ssr: false })
```

`ssr: false` 的效果：build 时这个组件**不生成任何 HTML**，浏览器加载后 JS 执行才渲染。因为整个区域对 LCP 无影响（它在页面下方），这个权衡是合理的。

---

## 5. layout 文件夹逐文件说明

```
components/layout/
├── Header.tsx              Server Component（'use client' 只为 useState 菜单状态）
│                           → 导航栏，locale prop 决定语言，SSG 时就渲染进 HTML
│
├── HeaderWrapper.tsx       薄包装层，让 Server Component 能渲染带 'use client' 的 Header
│                           → 传递 locale prop
│
├── SharedLayout.tsx        提取自两个 layout.tsx 的公共 html/body 骨架
│                           → Poppins 字体、Analytics、Providers、Header、Intercom、CookieBanner
│                           → 接收 lang 和 locale 参数，避免重复代码
│
├── FAQ.tsx                 Server Component
│                           → 纯静态内容，直接 JSON import，SSG 时完整写入 HTML
│
├── FAQItem.tsx             Client Component（需要 useState 控制展开/收起）
│                           → 被 FAQ.tsx 调用，SSG 时也会预渲染 HTML
│
├── Footer.tsx              Server Component
│                           → 纯静态内容，locale prop，SSG 时写入 HTML
│
├── CustomerSupport.tsx     Client Component + useTranslation
│                           → 复杂表单，保留 react-i18next
│
├── CustomerSupportClient.tsx   ssr: false 包装层
│                           → 阻止 SSG 预渲染，防止 hydration mismatch
│
├── Analytics.tsx           Client Component
│                           → GTM + HubSpot，cookie 同意后才加载，afterInteractive
│
├── Intercom.tsx            Client Component
│                           → Intercom widget，lazyOnload 不阻塞渲染
│
└── CookieBanner.tsx        Client Component
                            → localStorage 检查，ssr: false 不合适（需要首次展示），
                              但内容极轻，hydration 一致（都先渲染隐藏状态）
```

---

## 6. app/ 目录结构

```
app/
├── globals.css             Tailwind v4 主题 token + 自定义 variant
├── providers.tsx           React Query Provider + i18n 初始化
│
├── (en)/                   路由组（括号不影响 URL）
│   ├── layout.tsx          EN 页面的 html/body、字体、metadata
│   ├── page.tsx            → /（根路径重定向或直接渲染）
│   └── tracking/
│       └── page.tsx        → /tracking/  主英文追踪页
│
└── (fr)/                   路由组
    ├── layout.tsx          FR 页面的 html/body，lang="fr-CA"，metadata
    └── fr/suivi/
        └── page.tsx        → /fr/suivi/  法文追踪页
```

两个 layout.tsx 的 metadata（title、description、canonical URL 等）必须分开，Next.js 从这里读取 SEO 信息。但 html/body 骨架完全一样，已提取到 `SharedLayout`：

```tsx
// (en)/layout.tsx 现在只剩 metadata + 一行调用
export default function EnLayout({ children }) {
  return <SharedLayout lang="en-CA" locale="en">{children}</SharedLayout>
}

// (fr)/layout.tsx 同理
export default function FrLayout({ children }) {
  return <SharedLayout lang="fr-CA" locale="fr">{children}</SharedLayout>
}
```

新增语言只需：新建路由组 + layout.tsx（写 metadata）+ page.tsx（传 locale），不用复制任何骨架代码。

---

## 7. 为什么 Lighthouse 性能是 100（桌面）

| 优化点 | 做了什么 |
|--------|----------|
| 去掉 moment.js | 节省 ~3MB JS，改用原生 Date |
| jszip 懒加载 | 只在用户下载 POD 时才 import |
| FAQ/Footer Server Component | 内容在 HTML 里，无需等 JS |
| Header locale prop | 导航栏在 HTML 里，无需等 JS |
| TrackingInput locale prop | 输入框在 HTML 里，LCP 极快 |
| ssr: false 骨架屏移除 | 首屏直接有内容，不再闪烁 |
| Intercom/GTM lazyOnload | 不阻塞首屏渲染 |

---

## 8. 已完成的代码结构优化

### 8.1 `ClientOnlyHeader.tsx` → `HeaderWrapper.tsx`

名字更准确：这个包装层存在的原因不是"只在客户端"，而是让 Server Component 的 layout.tsx 能引用带 `'use client'` 的 Header。

### 8.2 `TrackingHero.tsx` 已删除

原本是 `ssr: false` + 骨架屏的包装层，去掉 `ssr: false` 后只剩 3 行空壳。三个 page.tsx 现在直接 import `PageContent`。

### 8.3 `SharedLayout.tsx` 提取公共骨架

两个 layout.tsx 的 html/body 结构完全相同，提取后每个 layout.tsx 只剩 metadata + 一行 `<SharedLayout>`。扩展新语言时不需要复制任何骨架代码。
