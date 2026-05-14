# Analytics & Marketing Tags Audit

> 审计方式：对比生产环境（`www.uniuni.com` — WordPress/Shortcoder）与开发环境（`localhost:3000` — React）实际 HAR 网络请求
> HAR 录制版本：v2（2026-05-14，含完整操作流程）
> 操作覆盖：页面加载 → 搜索单号 → 查看结果 → 滚动页面 → 填写客服表单

---

## 1. Tag 实装状态对比

| Tag | ID | Prod | Dev | 差异 |
|-----|----|------|-----|------|
| Google Tag Manager | `GTM-563V498` | ✅ | ✅ | — |
| GA4 | `G-QF1ELHQT9Y` | ✅ | ✅ | ⚠️ 见 §2 |
| Google Ads 再营销 | `AW-16823200896` | ✅ | ✅ | — |
| Facebook Pixel | `1136060545393230` | ✅ | ✅ | — |
| Microsoft Clarity | `vmm8h2ip9q` | ✅ | ✅ | — |
| HubSpot | `49003739` | ✅ | ✅ | — |
| LinkedIn Insight | `pid=8416905` | ✅ | ✅ | — |
| Google UA (legacy) | `UA-210083358-1` | ✅ analytics.js | ❌ | ⚠️ 见 §4 |

---

## 2. GA4 事件对比

### 2.1 捕获到的事件

| 事件 | Prod | Dev |
|------|------|-----|
| `page_view` | ✅ 1 次 | ✅（录制开始前已发送，未被 HAR 捕获）|
| `scroll`（90% 深度）| ❌ 未捕获 | ✅ 1 次 |
| `form_start` | ❌ 未捕获 | ✅ 1 次 |
| 自定义业务事件（搜索、POD 查看等）| ❌ 无 | ❌ 无 |

> Prod 缺 scroll / form_start 不代表 GTM 不支持，只是本次录制操作未触发这两个 GTM Enhanced Measurement 事件。

### 2.2 GA4 配置参数

| 参数 | Prod | Dev |
|------|------|-----|
| `ep.link_attribution` | ❌ 缺失 | ✅ `true` |
| `ep.anonymize_ip` | ❌ 缺失 | ✅ `true` |

**Prod 缺失的原因**：Prod 是 WordPress 站，未部署 React 代码修复；GTM 的 GA4 Configuration Tag 触发条件可能限制了域名，本次录制会话未满足触发条件。

**Dev 已修复**：`Analytics.tsx` 在 GTM snippet 前注入 `ga4-config` script，显式设置这两个参数，所有环境生效。

### 2.3 Dev GA4 事件详情

```
en=scroll
  ep.link_attribution = true
  ep.anonymize_ip     = true
  epn.percent_scrolled = 90

en=form_start
  ep.link_attribution     = true
  ep.anonymize_ip         = true
  ep.form_destination     = http://localhost:3000/tracking
  epn.form_length         = 13
  ep.first_field_id       = first-name
  ep.first_field_type     = text
  epn.first_field_position = 3
```

---

## 3. 其他 Tag 详情

### Facebook Pixel

| 事件 | Prod | Dev |
|------|------|-----|
| `PageView` | ✅ 1 次 | ✅ 1 次 |
| `SubscribedButtonClick` | ✅ 3 次 | ✅ 10 次 |

`SubscribedButtonClick` 是 Facebook Pixel 自动检测按钮点击生成的，Dev 次数更多是因为操作交互更丰富（点击 Track、POD、表单按钮等），属于正常行为。

### Google Ads

| 请求类型 | Prod | Dev |
|---------|------|-----|
| `doubleclick` 再营销转化 | ✅ | ✅ |
| `rmkt/collect` 再营销 | ✅ | ✅ |
| 总计 | 7 次 | 17 次（交互更多）|

### Clarity

| Prod | Dev |
|------|-----|
| 7 次 collect | 11 次 collect |

两边均正常录制会话，Dev 次数更多因操作时间更长。

### LinkedIn Insight

两边各 1 次 collect，一致 ✅

### HubSpot

| Prod | Dev |
|------|-----|
| 2 次加载 | 5 次加载 |

Dev 次数较多因页面有多次 HubSpot 脚本请求（hs-scripts.com 重定向到 js-na3），属于正常行为。

---

## 4. Google UA Legacy

Prod 加载了 `analytics.google.com/analytics.js`（UA `UA-210083358-1`），Dev 没有。

**不需要处理**：Google Universal Analytics 已于 2024 年 7 月停止处理 hits，新的 React 门户无需实现。

---

## 5. 业务事件缺口

**两个环境均未捕获**以下关键用户行为的 GA4 自定义事件：

| 用户操作 | 当前状态 | 建议事件名 |
|---------|---------|----------|
| 点击 Track 搜索单号 | ❌ 无事件 | `search` / `track_parcel` |
| 搜索结果展示（N 个包裹）| ❌ 无事件 | `view_search_results` |
| 点击 View Delivery Confirmation | ❌ 无事件 | `view_pod` |
| 客服表单提交成功 | ❌ 无事件（`form_start` 有，`form_submit` 无）| `generate_lead` / `form_submit` |

> 这些事件需 Marketing 确认是否需要。如果需要，在 React 代码里调用 `gtag('event', ...)` 或在 GTM 配置对应触发器。

---

## 6. 结论与行动项

| 优先级 | 问题 | 状态 |
|--------|------|------|
| ✅ 无问题 | GA4 `anonymize_ip` Dev/Prod 不一致 | `anonymize_ip` 是 UA 遗留参数，GA4 默认已匿名 IP，该参数无实际效果；`link_attribution` 仅影响归因精度，非合规要求。两环境不一致不影响合规也不影响数据准确性，无需修复 |
| 🟢 低 | UA legacy 仅 prod 加载 | 无需处理，UA 已停服 |
| ⏳ 待 Marketing 决策 | 业务自定义事件（搜索、POD、表单提交）均未追踪 | 确认需求后在代码或 GTM 配置 |
