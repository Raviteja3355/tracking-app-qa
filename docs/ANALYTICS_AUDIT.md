# Analytics & Marketing Tags Audit — Tracking Portal

Source of truth: PRD Section 4.3 + 6.2, and live network tab of `https://www.uniuni.com/tracking/`.

---

## 1. Implementation Status

| Tool | PRD Req | ID / Key | Priority | Status | Notes |
|---|---|---|---|---|---|
| **Intercom** | F-11 | `l054jq87` | P0 | ✅ Done | `components/layout/Intercom.tsx` |
| **Google Tag Manager** | F-12 | `GTM-563V498` | P0 | ❌ Missing | Removed — see §3 |
| **Google Analytics 4** | F-13 | `G-QF1ELHQT9Y` | P0 | ❌ Missing | Loads via GTM |
| **Facebook Pixel** | F-14 | `1136060545393230` | P0 | ❌ Missing | PageView on load |
| **Microsoft Clarity** | F-15 | `vmm8h2ip9q` | P1 | ❌ Missing | |
| **HubSpot** | F-16 | `49003739` | P1 | ❌ Missing | content-type: standard-page |

### Live site extras (not in PRD — confirm with Marketing)

| Tool | ID | Action Needed |
|---|---|---|
| Google Ads | `AW-16823200896` | Confirm if remarketing tag also needed here |
| LinkedIn Insight Tag | `pid=8416905` | Confirm if needed on standalone portal |
| LeadFeeder / Dealfront | `lftracker_v1_lAxoEaKXg0A8OYGd` | Confirm if needed |
| Google UA (legacy) | `UA-210083358-1` | GA Universal Analytics 已于 2024-07 停服，**不迁移** |

---

## 2. GA4 Configuration Details (PRD F-13)

PRD 要求两个非默认参数：

```js
gtag('config', 'G-QF1ELHQT9Y', {
  link_attribution: true,   // 记录点击链接的归因
  anonymize_ip: true,       // 隐匿 IP（GDPR 合规）
});
```

这两个参数**必须在 GTM 的 GA4 Configuration Tag 里配置**，不能只装 GTM snippet 就完事。

---

## 3. GTM 移除的原因和解决方案

### 原因

GTM 容器 `GTM-563V498` 是给 WordPress 配置的，容器内有引用 jQuery 的 tag（Elementor / WPBakery 相关），在纯 React 环境下触发 `jQuery is not defined` 报错，因此被暂时移除。

### 解决方案（二选一）

**方案 A（推荐）：Marketing 在 GTM 后台清理 WordPress tag，然后重新启用 GTM**

- 优势：GA4 / Google Ads / Facebook / Clarity / LinkedIn 全在 GTM 统一管理，Marketing 自助配置，不需要动代码
- 需要 Marketing 在 GTM 后台将 WordPress 专用 tag 的触发条件限制为 `Page URL contains uniuni.com` 或直接暂停这些 tag

**方案 B：不用 GTM，逐个直接埋**

- 适合 GTM 后台权限不好协调时的临时方案
- 维护成本高，Marketing 每次改 tag 都需要走开发流程
- **不推荐**长期使用

---

## 4. 准备工作 Checklist（在写代码之前）

### Engineering 自己确认

- [ ] GTM 后台是否有权限？能否查看容器内的 tag 列表？

### 需要 Marketing 配合

- [ ] **GTM**：确认容器 `GTM-563V498` 内哪些 tag 依赖 jQuery，能否暂停或限制触发条件
- [ ] **Facebook Pixel**：确认 Pixel ID `1136060545393230`，是否只需要 `PageView`，还是需要其他自定义事件（`Search` / `ViewContent`）
- [ ] **Google Ads**：`AW-16823200896` 是否需要在独立门户上打标（Remarketing tag？还是 Conversion？）
- [ ] **LinkedIn**：`pid=8416905` 是否需要？
- [ ] **LeadFeeder**：是否需要？
- [ ] **HubSpot** content-type 确认：PRD 写的是 `standard-page`，HubSpot 后台是否已配置对应规则

---

## 5. 实现方式（方案 A 路线）

### 5.1 GTM Snippet

在 `app/(en)/layout.tsx` 和 `app/(fr)/layout.tsx` 的 `<head>` 里加：

```tsx
// GTM script tag (in <head>)
<script
  dangerouslySetInnerHTML={{
    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-563V498');`,
  }}
/>

// GTM noscript (in <body> after <body> tag)
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-563V498"
    height="0" width="0"
    style={{ display: 'none', visibility: 'hidden' }}
  />
</noscript>
```

### 5.2 Facebook Pixel（如果 GTM 后台无法搞定，才直接埋）

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `!function(f,b,e,v,n,t,s){...}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','1136060545393230');fbq('track','PageView');`,
  }}
/>
```

### 5.3 Microsoft Clarity（如果 GTM 后台无法搞定）

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","vmm8h2ip9q");`,
  }}
/>
```

### 5.4 HubSpot（如果 GTM 后台无法搞定）

```tsx
<script
  async
  defer
  src="//js.hs-scripts.com/49003739.js"
/>
```

---

## 6. 验证方法

### GTM / GA4

1. 安装 Chrome 扩展 **Tag Assistant Legacy** 或用 **GTM Preview 模式**
2. 访问 `http://localhost:8080/tracking/`，确认 GTM container fired
3. GA4 DebugView（`analytics.google.com` → DebugView）看 `page_view` 事件

### Facebook Pixel

1. 安装 **Meta Pixel Helper** Chrome 扩展
2. 访问页面，确认 Pixel `1136060545393230` fired `PageView`

### Microsoft Clarity

1. 登录 `clarity.microsoft.com`，进项目 `vmm8h2ip9q`
2. 等待 2 小时后在 Dashboard 看是否有 session 录制

### HubSpot

1. 登录 HubSpot → Reports → Traffic Analytics → 看 tracking 页面是否出现

---

## 7. 优先级和顺序

```
1. 先拿到 GTM 后台权限，确认容器内 tag 情况        ← 等 Marketing
2. GTM 后台清理 WordPress tag / 限制触发条件
3. 在两个 layout.tsx 加 GTM snippet（30 分钟）
4. 在 GTM 后台配 GA4 Configuration Tag（加 link_attribution + anonymize_ip）
5. 验证 GTM + GA4 + Facebook（这三个都在 GTM 容器里）
6. 确认 LinkedIn / LeadFeeder 是否需要
```
