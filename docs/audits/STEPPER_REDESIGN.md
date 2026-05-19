# Stepper Redesign — Design Document

> PRD Reference: Section 9 (v1.3, 2026-05-19)
> Status: **待 Review**

---

## 1. 现状 vs 目标

### 现状（当前实现）

- 固定 4 步：Label Created → In Transit → Out for Delivery → Delivered
- `getProgressStep(result)` 返回 `0–3`，基于 `result.state` 单一字段
- `STATE_STEP_MAP` 只覆盖少数状态码（190, 191, 192, 198, 202, 203, 228）
- 4 步标签全部固定，无动态文案

### 目标（PRD v1.3 Section 9）

- 5 个里程碑（M1–M5），M4 条件性显示，M5 标签动态
- 必须扫描 **完整 spath 历史**，不能只看 `result.state`
- M4 从未出现过 → 整个 M4 节点隐藏（bar 变为 4 节点）
- 已到达的里程碑显示标签；未到达的只显示灰点

---

## 2. 里程碑定义

| ID | 标签（默认） | 触发状态码 |
|----|------------|-----------|
| M1 | Label Created | 190, 1870 |
| M2 | Facility Received | 199（仅首次） |
| M3 | In Transit | 1910, 4010, 195, 255, 218, 219, 200；199 二次及以上 |
| M4 | 动态（见下） | 202, 220, 231, 232, 212, 213 |
| M5 | 动态（见下） | 203, 216, 228, 217, 206, 207, 209, 215, 222, 229, 230, 235 |

**M4 动态标签**

| 状态码 | 显示文案 |
|--------|---------|
| 202, 220, 231, 232 | Out for Delivery |
| 212 | Incomplete Address |
| 213 | Undeliverable |

**M5 动态标签**

| 状态码 | 显示文案 |
|--------|---------|
| 203, 216, 228 | Delivered |
| 217 | Transferred |
| 206, 207, 209, 215, 222, 229, 235 | Exception |
| 230 | Returned to Sender |

**不显示给用户的状态码：** 204, 211, 233, 234

---

## 3. 数据类型

```typescript
// lib/types/index.ts 新增
export type MilestoneId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5'

export interface Milestone {
  id: MilestoneId
  label: string        // 已解析的显示文案（调用方传入 t()）
  reached: boolean     // spath 历史中出现过此里程碑的状态码
  active: boolean      // 当前所处里程碑（最后一个 reached）
}
```

---

## 4. 核心算法：`getMilestones()`

**位置：** `lib/utils/trackingStatus.ts`，替换 `getProgressStep()`

```
输入：result: TrackingResult
输出：Milestone[]（长度 4 或 5，取决于 M4 是否出现过）
```

**算法步骤：**

```
states = spath_list.map(s => s.state)   // 完整历史状态码列表

─── 1. 计算各里程碑是否在历史中出现过（reached）───

M1_CODES = [190, 1870]
M2_CODE  = 199
M3_CODES = [1910, 4010, 195, 255, 218, 219, 200]
M4_CODES = [202, 220, 231, 232, 212, 213]
M5_CODES = [203, 216, 228, 217, 206, 207, 209, 215, 222, 229, 230, 235]

m1Reached = states.some(s => M1_CODES.includes(s))
            // 兜底：有 spath 记录就至少 M1 = true

has199    = states.includes(199)
has199Count = states.filter(s => s === 199).length
hasM3codes  = states.some(s => M3_CODES.includes(s))
hasM4codes  = states.some(s => M4_CODES.includes(s))
hasM5codes  = states.some(s => M5_CODES.includes(s))

// M3 包含：M3_CODES 出现过，或 199 出现超过一次
m3Reached = hasM3codes || has199Count > 1

// M2 到达规则：
//   - 199 在历史中出现过（首次） OR
//   - M3 已到达但无 199（自动补标 M2）
m2Reached = has199 || m3Reached

m4Reached = hasM4codes   // M4 从未出现 → false → M4 节点整体隐藏
m5Reached = hasM5codes

─── 2. 确定 active 里程碑（当前所处位置）───

// 使用 result.state（API 返回的当前状态）确定落在哪个里程碑
// 优先级从高到低匹配

if   M5_CODES.includes(currentState)  → active = M5
elif M4_CODES.includes(currentState)  → active = M4
elif M3_CODES.includes(currentState)  → active = M3
elif currentState === 199             → active = M2 (首次) 或 M3 (多次)
elif M1_CODES.includes(currentState)  → active = M1
else                                  → active = M1 (兜底)

─── 3. 确定 M4/M5 动态标签───

M4 label：
  202/220/231/232 → t('milestoneM4OutForDelivery')
  212             → t('milestoneM4IncompleteAddress')
  213             → t('milestoneM4Undeliverable')
  (如 active ≠ M4，取 spath 中最后一个 M4 状态码对应标签)

M5 label：
  203/216/228     → t('milestoneM5Delivered')
  217             → t('milestoneM5Transferred')
  206/207/209/215/222/229/235 → t('milestoneM5Exception')
  230             → t('milestoneM5Returned')
  (如 active ≠ M5，取 spath 中最后一个 M5 状态码对应标签)

─── 4. 组装输出数组───

base = [
  { id:'M1', label:t('milestoneM1'), reached:m1Reached, active:active==='M1' },
  { id:'M2', label:t('milestoneM2'), reached:m2Reached, active:active==='M2' },
  { id:'M3', label:t('milestoneM3'), reached:m3Reached, active:active==='M3' },
  { id:'M5', label:m5Label,          reached:m5Reached, active:active==='M5' },
]

if (m4Reached):   // M4 出现过才插入
  insert { id:'M4', label:m4Label, reached:true, active:active==='M4' } at index 3

return base  // 长度 4 或 5
```

---

## 5. ProgressTracker 组件改动

**当前签名：**
```typescript
function ProgressTracker({ step }: { step: number })
```

**新签名：**
```typescript
function ProgressTracker({ milestones }: { milestones: Milestone[] })
```

**渲染规则：**

| 状态 | 节点样式 | 标签 |
|------|---------|------|
| `active` | 大圆（50px），品牌色，卡车图标 | 显示，**加粗** |
| `reached && !active` | 小圆点，品牌色实心 | 显示，普通粗细 |
| `!reached` | 小圆点，灰色（`uni-input-border`） | 不显示（仅圆点） |

连接线：
- `reached` 之间的线段 → 品牌色
- 含 `!reached` 端点的线段 → 灰色

节点数量动态（4 或 5），连接线使用 `grid-cols-[N-1]`。

---

## 6. ResultCard 顶部区域影响

当前判断逻辑 `if (step === 3)` 用于显示送达日期，需替换为：

```typescript
const milestones = getMilestones(result, t)
const isDelivered = milestones.find(m => m.id === 'M5')?.reached
                    && M5_DELIVERED.includes(result.state)
```

EDD 显示条件不变（`country === 'US' && edd_enabled`），只是 `step` 引用替换为 milestone 判断。

---

## 7. URP 特殊处理

现有 `isURPDelivered()` 逻辑（state 190 + events 含 "Delivered"）保留，在 `getMilestones()` 中：
- 若 URP delivered → active = M5，m5Reached = true，M5 label = "Delivered"

---

## 8. i18n 新增 key

```json
// en.json / fr.json 新增
"milestoneM1": "Label Created",
"milestoneM2": "Facility Received",
"milestoneM3": "In Transit",
"milestoneM4OutForDelivery": "Out for Delivery",
"milestoneM4IncompleteAddress": "Incomplete Address",
"milestoneM4Undeliverable": "Undeliverable",
"milestoneM5Delivered": "Delivered",
"milestoneM5Transferred": "Transferred",
"milestoneM5Exception": "Exception",
"milestoneM5Returned": "Returned to Sender"
```

---

## 9. 改动文件清单

| 文件 | 变更内容 |
|------|---------|
| `lib/types/index.ts` | 新增 `MilestoneId`、`Milestone` 类型 |
| `lib/utils/trackingStatus.ts` | 新增 `getMilestones()`；`getProgressStep()` 保留为 deprecated shim（转调 getMilestones） |
| `lib/constants.ts` | `STATE_STEP_MAP` 替换为分组常量（M1_CODES、M3_CODES 等） |
| `components/sections/tracking/results/ResultCard.tsx` | `ProgressTracker` 传 `milestones`；顶部区域 `step === 3` → milestone 判断 |
| `lib/i18n/locales/en.json` | 新增 10 个 milestone key |
| `lib/i18n/locales/fr.json` | 同上（FR 翻译） |

---

## 10. 边界情况

| 场景 | 预期行为 |
|------|---------|
| spath 为空 | M1 reached=true, active=M1，其余灰点 |
| 199 出现多次 | 首次 → M2，后续 → M3 |
| 有 M3 状态码但无 199 | M2 自动标为 reached（auto-shown 规则） |
| M4 在历史中出现但当前 state 是 M5 | M4 仍显示（reached=true），active = M5 |
| M4 从未出现 | bar 仅有 4 节点（M1→M2→M3→M5） |
| state 211/233/234 | 不影响里程碑计算，仅在时间线中过滤不显示 |
| URP 包裹（state 190 + events Delivered） | getMilestones 内检测，M5 reached=true, Delivered |
