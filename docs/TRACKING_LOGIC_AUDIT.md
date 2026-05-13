# Tracking Logic Audit — Shortcoder vs React

对比来源：
- 原版：`docs/shortcoder/tracking_form_multi_en(PROD).html` — `track()` 函数
- 新版：`lib/hooks/useTracking.ts` / `lib/api/*.ts` / `components/tracking/results/ResultCard.tsx`

---

## 1. Tracking API 请求

| 项目 | Shortcoder | React | 一致？ |
|---|---|---|---|
| URL | `https://delivery-api.uniuni.ca/cargo/trackinguniuninew` | `${cfg.deliveryApi}/cargo/trackinguniuninew` | ✅ |
| Method | GET | GET | ✅ |
| 参数 `id` | 逗号分隔的单号（大写） | 同 | ✅ |
| 参数 `key` | 硬编码 `SMq45nJhQuNR3WHsJA6N` | 来自 env var `NEXT_PUBLIC_TRACKING_API_KEY` | ✅ 逻辑一致 |
| Response | `{ status, data: { valid_tno[], invalid_tno } }` | 同 | ✅ |

---

## 2. 单号解析

两者逻辑完全一致：

```
input → 换行符替换为逗号 → 空白符替换为逗号 → toUpperCase → split(",") → filter(空字符串)
```

✅ **完全一致**

---

## 3. Response 处理

| 步骤 | Shortcoder | React |
|---|---|---|
| 判断成功 | `status !== "SUCCESS"` → 显示 error alert | `status !== "SUCCESS"` → 清空状态 |
| 读取有效结果 | `response.data.valid_tno` | 同 |
| 读取无效结果 | `response.data.invalid_tno`（字符串） | 同，解析为数组 |
| 过滤无轨迹结果 | ❌ 不过滤，直接渲染 | ✅ 检查 `spath_list` / `orders_list`，无轨迹的移入 invalid 列表 |

⚠️ **差异**：React 多了一层过滤，对同一 API 响应可能产生不同结果数量。

---

## 4. 状态码 → 进度步骤 映射

### Shortcoder 的颜色逻辑

| 条件 | 显示 |
|---|---|
| `state === 203` | 绿色（Delivered） |
| `state === 190` + URP 单号 + events 有 "Delivered" | 绿色（Delivered） |
| `state === 190`（其他） | 黄色（In Transit） |
| 其他 | 蓝色（In Transit） |

states 191 / 192 / 198：**没有显式处理**

### React 的 `getProgressStep()` 逻辑

| 条件 | Step | 标签 |
|---|---|---|
| `state === 203 \| 228` 或 URP Delivered | 3 | Delivered |
| `state === 190 \| 191 \| 192 \| 198` | 2 | Out for Delivery |
| `spath_list.length > 1` | 1 | In Transit |
| 默认 | 0 | Label Created |

⚠️ **差异**：
1. **State 190（非 URP Delivered）**：Shortcoder → 黄色 In Transit；React → Step 2（Out for Delivery）。标签文案不同。
2. **States 191 / 192 / 198**：Shortcoder 无显式处理；React 明确映射为 Step 2。
3. **State 228**：React 处理为 Delivered；Shortcoder 未见。

---

## 5. EDD（预计送达日期）

### API 请求

| 项目 | Shortcoder | React |
|---|---|---|
| URL | `https://prm-api.uniuni.com/version2/orders/edd_information` | `cfg.eddApiUrl`（env var） |
| Method | POST | POST |
| Body | `{ key, tnos: string[] }` | 同 |
| 时机 | 与 tracking 并发 `Promise.all` | 同 |
| 失败处理 | 静默返回 `{}` | 同 |

✅ **API 逻辑一致**

### 渲染逻辑

| 条件 | Shortcoder | React |
|---|---|---|
| 有 EDD 且 `edd_enabled = true` | 显示预计日期 | 显示预计日期 |
| Delivered | 显示实际送达日期 | 显示实际送达日期 |
| 无 EDD / 未启用 | 显示 "currently unavailable" 文案 | 显示 `—` |
| 未入网（state 190/1870） | 显示 "will be available" 文案 | 显示 `—` |

⚠️ **差异**：Shortcoder 有两种降级文案；React 统一显示 `—`，用户感知不同。

---

## 6. POD（送达证明）按钮显示条件

### Shortcoder

```
state === 203  →  显示
state === 190 AND URP单号 AND events含"Delivered"  →  显示
有 new_tno AND spath最后一条 pathInfo === "delivered"  →  显示（不判断 state）
```

### React `showPodButton()`

```
state === 203  →  显示
state === 190 AND URP单号 AND events含"Delivered"  →  显示
有 new_tno AND state !== 190 AND spath最后一条 pathInfo === "delivered"  →  显示
```

⚠️ **差异**：React 第三条件多了 `state !== 190` 的限制，某些 URP 190 + new_tno + Delivered 的订单，Shortcoder 会显示 POD 按钮，React 不会。

---

## 7. POD API 调用

| 项目 | Shortcoder | React |
|---|---|---|
| 主接口 | `dispatch_api/orders/getsignaturenew/filter/barcode?tno=&zipcode=` | 同 |
| 主接口响应 | `{ status: "SUCCESS", data: { signatures: [urls] } }` | 同 |
| URP 备用接口 | `dispatch_api/orders/getsignaturenew-urp?tno=&zipcode=` | 同 |
| URP 备用响应 | `{ code: 0, data: { images: [urls] } }` | 同 |
| PDF 主接口 | `dispatch_api/orders/downloadpods` | 同 |
| PDF URP 备用 | `dispatch_api/orders/downloadpods-urp` | 同 |
| Zip 格式化 | `formatZipCode()` 仅对 URP 备用接口 | 同 |

✅ **完全一致**

---

## 8. 错误处理

| 场景 | Shortcoder | React |
|---|---|---|
| 输入为空 | 显示 `#tracking-alert` DOM 元素 | 校验返回 false，不提交 |
| API status 非 SUCCESS | 显示 `#tracking-exceed-alert` DOM 元素 | 清空结果状态，无弹窗 |
| EDD API 失败 | 静默 catch，返回 `{}` | 同 |
| POD API 失败 | 自动 fallback 到 URP 接口 | 同 |
| POD zip 错误 | Modal 内显示具体文案 | 显示 ZipModal 错误提示 |

⚠️ **差异**：Shortcoder 有明确的页面级 error alert；React 的 API 错误在 hooks 层只做状态清空，依赖组件层展示错误——需确认组件层是否覆盖所有错误场景。

---

## 9. 批量查询

| 项目 | Shortcoder | React |
|---|---|---|
| 请求方式 | 单次 API 调用，`id` 为逗号分隔字符串 | 同 |
| EDD 请求 | 传入完整 tnoArray | 同 |
| 并发 | `Promise.all([tracking, edd])` | 同 |
| 结果处理 | 逐个调用 `trackRes()` 渲染 | 批量 setState，组件层渲染 |

✅ **逻辑一致**

---

## 10. Master TNo / 拼箱订单

| 项目 | Shortcoder | React |
|---|---|---|
| 检测方式 | `res.master_tno` 存在 | 同 |
| 子订单列表 | `res.orders_list` | 同 |
| 路径判断 | `orders_list.length > 0` | 同 |

✅ **一致**

---

## 差异汇总 & 风险评级

| # | 差异点 | 风险 | 建议 |
|---|---|---|---|
| D-1 | React 过滤无轨迹结果，Shortcoder 不过滤 | 🟡 中 | 确认产品预期，是否应展示无路径订单 |
| D-2 | State 190（非 URP Delivered）进度步骤标签不同 | 🟡 中 | 与产品确认 Step 2 标签是否应改为 "In Transit" |
| D-3 | States 191/192/198 Shortcoder 无显式处理 | 🟢 低 | React 的 Step 2 映射应该是正确的扩展 |
| D-4 | POD 按钮：React 对 `new_tno + state 190` 情况不显示 | 🔴 高 | 需复现该场景验证，可能漏掉 POD 入口 |
| D-5 | EDD 降级文案：Shortcoder 有 "unavailable" 提示，React 只显示 `—` | 🟡 中 | 与设计/产品确认是否需要加降级文案 |
| D-6 | API 错误：Shortcoder 显示明确 alert，React 静默清空 | 🟡 中 | 补充 toast 或错误提示（已在 PENDING_BLOCKERS D-01） |

---

## 结论

核心 API 调用逻辑（请求结构、并发策略、POD 接口、URP fallback）**与 Shortcoder 一致**。

主要风险集中在：
1. **POD 按钮 D-4**：需要用 state=190 + new_tno + delivered 的真实订单测试
2. **错误反馈 D-6**：用户在 API 失败时可能看不到任何提示
