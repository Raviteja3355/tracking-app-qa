# Tracking Logic Audit — Shortcoder vs React

> 基准来源：`docs/shortcoder/tracking_form_multi_en(PROD).html` + `tracking_multi_result_en(PROD).html`
> React 实现：`lib/hooks/` / `lib/api/` / `lib/context/TrackingContext.tsx` / `components/sections/tracking/`
>
> 图例：✅ 行为一致 ｜ ⚠️ 实现但有差异 ｜ ❌ 未实现 / 有缺陷

---

## 错误信息一览（逐条对比）

> 这是最重要的部分。每一行列出 Shortcoder 显示的**精确文字**、React 显示的**精确文字**，以及触发位置。

| # | 触发场景 | Shortcoder 精确文案 | React 精确文案 | 状态 |
|---|----------|---------------------|----------------|------|
| E-1 | track()：输入为空 | `#tracking-alert` → **"Please enter at least one valid tracking number."** | `t['alertInvalid']` → **"Please enter at least one valid tracking number."** | ✅ |
| E-2 | track()：超过 25 个单号 | ❌ 无此限制（shortcoder 不限制数量） | `t['alertExceed']` → **"You can enter a maximum of 25 tracking numbers at a time."** | ✅ React 增强 |
| E-3 | track()：API 返回 status ≠ SUCCESS | `#tracking-exceed-alert` → **"Exceeded the maximum number of packages"** | `t['alertApiError']` → **"Exceeded the maximum number of packages."** | ✅（React 多一个句点，可忽略） |
| E-4 | track()：网络异常（fetch 失败） | `#tracking-alert` → **"Please enter at least one valid tracking number."** | `t['alertInvalid']` → **"Please enter at least one valid tracking number."**（`useMutation onError` → `setShowInvalidAlert(true)`） | ✅ 已修复 |
| E-5 | ZipModal：提交空 zip | `.wrong-zip` → **"Incorrect postal code. Please try again"** | `t('errorIncorrectPostalCode')` → **"Incorrect postal code. Please try again"**（`setZipError('')` 触发默认文案） | ✅ 已修复 |
| E-6 | ZipModal：zip 错误（API 返回错误 ret_msg） | `showWrongZipMessage(ret_msg)` → 若 ret_msg 非空且不含 "zipcode" → 显示 ret_msg；否则 → **"Incorrect postal code. Please try again"** | `setZipError(msg)` → 若 msg 非空 → 显示 msg；若 msg 为 `""` → `t('errorIncorrectPostalCode')` = **"Incorrect postal code. Please try again"** | ✅ 逻辑等价 |
| E-7 | ZipModal："download" 路径：downloadPdf 抛出异常 | `.wrong-zip.show()` → **"Incorrect postal code. Please try again"**（ZipModal 保持打开） | `catch { setZipError('') }` → `t('errorIncorrectPostalCode')` → **"Incorrect postal code. Please try again"**（ZipModal 保持打开） | ✅ 已修复 |
| E-8 | ZipModal："view" 路径：fetchPodImages 成功但返回空数组 | （空数组不应发生；若 API 报错则走 E-6）| `if (!images.length) { setZipError('') }` → `t('errorIncorrectPostalCode')` → **"Incorrect postal code. Please try again"** | ✅ 已修复 |
| E-9 | ZipModal："view" 路径：fetchPodImages 抛出异常 | `showWrongZipMessage(ret_msg)` → **"Incorrect postal code. Please try again"** 或 API 消息 | `catch (err) → setZipError(msg)` → ZipModal 内显示错误 | ✅ |
| E-10 | PodModal：下载当前图片失败 | `alert("Failed to download image. Please try again.")` | `alert(t('errorDownloadImage'))` → **"Failed to download image. Please try again."** | ✅ 已修复 |
| E-11 | PodModal：下载全部图片（ZIP）失败 | `alert("Failed to create ZIP file. Please try again.")` | `alert(t('errorDownloadZip'))` → **"Failed to create ZIP file. Please try again."** | ✅ 已修复 |
| E-12 | PodModal：水印图片下载失败（canvas.toBlob 失败） | `alert("Failed to download watermarked image. Please try again.")` | `alert(t('errorDownloadWatermark'))` → **"Failed to download watermarked image. Please try again."** | ✅ 已修复 |
| E-13 | PodModal：水印图片 img 加载失败（onerror） | `alert("Failed to load image for watermarking. Please try again.")` | `alert(t('errorLoadWatermark'))` → **"Failed to load image for watermarking. Please try again."** | ✅ 已修复 |
| E-14 | EDD：预计送达日期已过期 | **"Estimated delivery is currently unavailable."** | 继续显示旧日期（例如 **"Thursday, April 03"**），不作任何过期判断 | ❌ **D-5** |
| E-15 | POD 弹窗：图片找不到（openPod catch）| ZipModal 内显示 **"Incorrect postal code. Please try again"** | React 有独立逻辑：`setPodError(msg)` → PodModal 全屏遮罩弹窗显示 `t('podNotFound')` = **"No proof of delivery photo is available for this package."** 并附 Okay 按钮 | ⚠️ 文案更准确，但触发路径几乎不可达（`openPod` 仅做同步 setState，catch 无实际触发机会） |

---

## 一、页面初始化

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| URL `?no=` 自动填入并查询 | ✅ | ✅ `TrackingApp.tsx` useEffect | ✅ |
| URL `#tracking-detail?no=` hash 格式（首页 widget 跳转）| ✅ 依赖锚点滚动 | ✅ 解析单号 + 结果返回后 scrollIntoView | ✅ |
| URL `?zip=` 自动打开 POD 跳过弹窗 | ✅ | ✅ `pendingZipRef` + useEffect | ✅ |

---

## 二、`track()` 主流程

### 2.1 清理状态

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 隐藏 alert | hideAlert / hideExceedAlert | setShowInvalidAlert(false) / setShowExceedAlert(false) | ✅ |
| 清空上次结果 | trackingHideDetail() | onSuccess 重置 state | ✅ |
| 清空图片区域 | `jQuery(".tracking-images").html("")` | closePod() / PodModal state reset | ✅ |

### 2.2 输入标准化

| 规则 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 换行符 → 逗号 | ✅ | ✅ `useTracking` mutationFn | ✅ |
| 空白符 → 逗号 | ✅ | ✅ | ✅ |
| toUpperCase | ✅ | ✅ | ✅ |
| 空输入拦截 | ✅ → **E-1 文案** | ✅ → **E-1 文案** | ✅ |
| 最大单号数量限制 | ❌ 无限制 | ✅ MAX_NUMBERS = 25 → **E-2 文案** | ✅ React 增强 |

### 2.3 并发请求

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| EDD 与 Tracking 同时发出 | ✅ `const eddPromise = fetchEDD()` | ✅ `Promise.all([fetchTracking, fetchEdd])` | ✅ |

### 2.4 Tracking API

| 项目 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| URL | `delivery_api_domain/cargo/trackinguniuninew` | `cfg.deliveryApi/cargo/trackinguniuninew` | ✅ |
| 参数 id | 逗号分隔大写单号 | 同 | ✅ |
| 参数 key | 硬编码 `SMq45nJhQuNR3WHsJA6N` | env var `NEXT_PUBLIC_TRACKING_API_KEY` | ✅ |

### 2.5 Response 检查

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| status ≠ SUCCESS → 显示错误 | `#tracking-exceed-alert` → **E-3 文案** | `setApiError(true)` → **E-3 文案** | ✅ |
| 网络异常 → 显示错误 | `error:` 回调 → `#tracking-alert` → **E-4 文案** | `useMutation onError` → `setShowInvalidAlert(true)` → **E-4 文案** | ✅ 已修复 |

### 2.6 URL zip 参数（直链自动打开 POD）

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 结果只有 1 条 + URL 含 zip= | 自动调 getOrderImage，跳过 modal | ✅ `pendingZipRef` + useEffect 监听 validResults | ✅ |

### 2.7 渲染结果卡片

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| EDD 数据传入卡片 | `eddMap[res.tno]` | `eddMap[result.tno]` | ✅ |

### 2.8 Excel 导出

| 列 | Shortcoder | React | 状态 |
|----|------------|-------|------|
| tno / city / latest_time / latest_track / tracking_info | ✅ | ✅ `buildExportRows` | ✅ |
| EDD 列（仅 US + edd_enabled + 有日期） | ✅ | ✅ 同条件 | ✅ |
| 拼箱子单各自一行 | ✅ orders_list 遍历 | ✅ | ✅ |

### 2.9 无效单号

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| API 返回的 invalid_tno 显示 | ✅ | ✅ InvalidSection 组件 | ✅ |
| 无 spath 的 valid_tno 降级为 invalid | ❌ 不过滤，显示空卡片 | ❌ 不过滤，显示空卡片（移除 `extraInvalid`） | ✅ 已修复 |

### 2.10 显示与滚动

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 结果数量标题 "N Tracking result(s)" | ✅ | ✅ `t('trackingResultCount')` | ✅ |
| 平滑滚动到结果区 | scrollIntoView | ✅ resultsRef.scrollIntoView | ✅ |

---

## 三、`fetchEDD()`

| 项目 | Shortcoder | React (`lib/api/edd.ts`) | 状态 |
|------|------------|--------------------------|------|
| URL | `edd_api_url` | `cfg.eddApiUrl` | ✅ |
| Method | POST | POST | ✅ |
| Body | `{ key, tnos: string[] }` | 同 | ✅ |
| 返回值结构 | `{ tno → { delivery_estimate, edd_enabled } }` | 同 | ✅ |
| 失败处理 | 静默返回 `{}` | ✅ catch 返回 `{}` | ✅ |

---

## 四、`trackRes()` → React 组件层

### 4.1 卡片状态点颜色（`dotClass()`）

| 条件 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| state 203 → 绿色 | ✅ | ✅ | ✅ |
| state 228 → 绿色 | ❌ 无显式处理 | ✅ 加入绿色 | ✅ 合理扩展 |
| state 190 + URP Delivered → 绿色 | ✅ | ✅ isURPDelivered | ✅ |
| state 190（其他）→ 黄色 | ✅ | ✅ | ✅ |
| state 1870 → 黄色 | ✅ | ✅ | ✅ |
| 默认 → 蓝色 | ✅ | ✅ | ✅ |

### 4.2 进度步骤（Progress Tracker）

> Shortcoder 无此 4 步进度条，是 React 新设计，对应 shortcoder 状态点颜色含义。

| 条件 | Shortcoder 点颜色 | React Step | 状态 |
|------|-------------------|------------|------|
| state 203/228 → Delivered | 绿色 | Step 3 "Delivered" | ✅ |
| URP Delivered → Delivered | 绿色 | Step 3 "Delivered" | ✅ |
| state 191/192/198/202 → Out for Delivery | 蓝色 | Step 2 "Out for Delivery" | ✅ 合理扩展 |
| state 190 → 未入 UniUni 网络 | 黄色（无文字说明）| Step 0 "Label Created" | ⚠️ D-2 |
| spath_list.length > 1 → 在途 | 蓝色 | Step 1 "In Transit" | ✅ |
| 默认 | 蓝色 | Step 0 "Label Created" | ✅ |

### 4.3 时间线渲染（`resolveTimeDate()`）

| 条件 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| state 192/198 → formatTimeCST | ✅ | ✅ | ✅ |
| state 190 → formatTime + " (UTC)" | ✅ | ✅ | ✅ |
| state 213 + 最新条目 + 超 7 天 → ReturnContact 提示 | ✅ | ✅ isSevenDaysFromNow | ✅ |
| state 203 + pathTime → deliveredDetailTemplate | ✅ | ✅ isDeliveredItem | ✅ |
| state 203 + 无 pathTime → dateTime.localTime | ✅ | ✅ | ✅ |
| URP + !state + pathInfo==="Delivered" → deliveredDetailTemplate | ✅ | ✅ | ✅ |
| state 230/235（退件 POD）| 已注释归档 | ❌ 不实现（N/A） | N/A |

### 4.4 "View Delivery Confirmation" 链接

| 条件 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 时间线中 delivered item 显示链接 | ✅ | ✅ TimelineItem `isDeliveredItem` | ✅ |

### 4.5 POD 访问入口

**React 设计决策：所有 POD 访问统一走 "View Delivery Confirmation" → ZipModal → PodModal，下载在 PodModal 内完成。无独立 "Download POD" 按钮流程。**

| Case | Shortcoder | React | 状态 |
|------|------------|-------|------|
| state 190 + URP Delivered → "Download POD" 按钮（直接下载 PDF） | ✅ | "View Delivery Confirmation" → ZipModal → PodModal → 内部下载 | ✅ 功能等价，交互设计不同 |
| state 203 + CA → "Download POD" 按钮（直接下载 PDF） | ✅ | 同上 | ✅ 功能等价 |
| state 203 + US → 无 Download POD 按钮 | ❌ 无 | ❌ 无 | ✅ 一致 |
| new_tno + spath 最后项 delivered (state ≠ 190) → "Download POD" 按钮 | ✅ | 同上 | ✅ 功能等价 |

> `handleDownloadPod`、`downloadPdf`、`ZipModalState.request: 'download'`、`btnDownloadPod` 已全部移除（D-3/D-4 以产品设计决策关闭）。

---

## 五、EDD 显示逻辑

### 5.1 前置条件

| 条件 | Shortcoder | React (ResultCard) | 状态 |
|------|------------|---------------------|------|
| 仅 US 订单显示 | `country !== "US"` → return | `result.country === 'US'` 显式检查，与 shortcoder 一致 | ✅ 已修复（D-8） |
| edd_enabled false → 不显示 | ✅ | ✅ | ✅ |

### 5.2 四种显示状态（含精确文案）

| 状态 | Shortcoder 精确文案 | React 精确文案 | 状态 |
|------|---------------------|----------------|------|
| state 190/1870 → pending | **"Estimated delivery will be available once your parcel arrives at UniUni's facility."** | `t('eddPending')` = **同文案** | ✅ |
| Delivered → 找 spath item | 正向遍历 spath_list，取第一个 `state 203/228` 或 `pathInfo==="Delivered"` 的 item | 正向遍历找第一个 `state 203/228/pathInfo='Delivered'` item，fallback 到最后一项 | ✅ 已修复（D-13） |
| Delivered → 日期格式 | **"Thursday, April 09"**（weekday + month + 零填充日） | **"Thursday, April 09"**（`toLocaleDateString` + `padStart(2,'0')`） | ✅ 已修复（D-13） |
| Delivered → 时间显示 | **"at 3:45 P.M."**（12 小时制，大写 A.M./P.M.，独立一行） | **"at 3:45 P.M."**（`topTime` 渲染在大日期下方，`text-[15px] text-uni-muted`） | ✅ 已修复（D-13） |
| EDD 有效（date >= today）→ 显示预计日期 | 字符串比较 `>=`，若今天则显示 **"Today"**；否则显示 **"Thursday, April 09"** 格式 | 直接显示 eddDate（**不检查是否 >= today**，无 "Today" 特殊处理） | ❌ D-5 |
| EDD 已过期（date < today）→ 不可用 | **"Estimated delivery is currently unavailable."** | 继续显示旧日期（例如 **"Thursday, April 03"**） | ❌ D-5，见 E-14 |

> **EddBlock.tsx** 有完整的过期判断（含 `getTodayInTimezone()`）及正确的 "currently unavailable" 渲染，但该文件是 dead code，未被任何组件引用（D-6）。

---

## 六、`getNotice()` → 仓库公告

| 项目 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 触发条件：最后一条 spath 的 warehouse > 0 | ✅ | ✅ ParcelCard useEffect | ✅ |
| warehouse ID 计算：+100000 | ✅ | ✅ | ✅ |
| CA → driver_app_ca，US → driver_app_us | ✅ | ✅ `cfg.driverAppUs/Ca` | ✅ |
| API：`/messages/inbox/{id}/3` | ✅ | ✅ | ✅ |
| 渲染：红色感叹号 + title + content | ✅ | ✅ NoticeBlock 组件 | ✅ |
| 失败静默 | ✅ | ✅ catch 返回 `[]` | ✅ |

---

## 七、`trackTickets()` → 拼箱视图

| 项目 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 检测拼箱：`master_tno` 存在 | ✅ | ✅ `isTicket = !!result.master_tno` | ✅ |
| 点击卡片进入子单列表视图 | ✅ openDetail | ✅ `piecesView` state | ✅ |
| 子单 spath 各自渲染时间线 | ✅ | ✅ 每个 piece 对应一个 ParcelCard | ✅ |
| 显示 "X of N piece shipment" | ✅ | ✅ `t('pieceShipment', { count })` | ✅ |
| 显示已送达数量 "X/N Delivered" | ✅ delivered_count | ✅ `piecesView.deliveredCount` | ✅ |
| 子单状态点颜色（190黄/203绿/其他蓝）| ✅ | ✅ dotClass() | ✅ |

---

## 八、`validateURPTrackingNo()`

| 项目 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 正则 `/^UR\d{17}$/` | ✅ | ✅ `lib/utils/validation.ts` | ✅ |
| formatZipCode（CA 邮编格式化）| ✅ 仅 URP API 调用时使用 | ✅ `lib/utils/zipCode.ts` | ✅ |

---

## 九、POD 图片查看与下载

### 9.1 ZIP Modal 流程

| 行为 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| URP 与普通包裹均经过 ZIP modal | ✅ `openModal(index, request)` 统一入口 | ✅ `openZipModal(index, 'view'/'download')` 统一入口 | ✅ |
| 空 zip 提交 → 显示错误 | ✅ `.wrong-zip.show()` → 见 **E-5** | `setZipError('')` → `t('errorIncorrectPostalCode')` → 见 **E-5** | ✅ 已修复 |
| zip 错误（API 返回错误 ret_msg）→ 显示错误 | ✅ `showWrongZipMessage(ret_msg)` → 见 **E-6** | ✅ `setZipError(msg)` → 见 **E-6** | ✅ |
| download 失败 → 显示错误 | ✅ `.wrong-zip.show()` → 见 **E-7** | N/A：`ZipModalState.request` 已移除 `"download"` 分支，download 路径不再存在 | ✅ 已修复（D-12） |
| view 成功但 images 为空 → 显示错误 | ✅（API 报错走 E-6）| `if (!images.length) { setZipError('') }` → `t('errorIncorrectPostalCode')` → 见 **E-8** | ✅ 已修复（D-12） |

### 9.2 POD 加载

| 功能 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 主接口 `getsignaturenew/filter/barcode` | ✅ | ✅ `lib/api/pod.ts` | ✅ |
| URP 备用接口 `getsignaturenew-urp` | ✅ 自动 fallback | ✅ | ✅ |
| zip 错误 → ZipModal 显示错误 | ✅ | ✅ | ✅ |
| 加载中 loading 遮罩 | ✅ `#loader-group` | ✅ `podLoading` state | ✅ |

### 9.3 图片导航

| 功能 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| 只有 1 张时隐藏 prev/next 按钮 | ✅ `jQuery(".nav-btn").hide()` | ✅ `{total > 1 && <button>}` | ✅ |
| 第一张时 prev 禁用 | ✅ `.addClass("disabled")`（opacity 0.5, cursor not-allowed） | ✅ HTML `disabled` 属性 | ✅ |
| 最后一张时 next 禁用 | ✅ `.addClass("disabled")` | ✅ HTML `disabled` 属性 | ✅ |
| 点击越界保护 | ✅ 函数内 guard `if (index === 0) return` | ✅ `Math.max(0, ...)` / `Math.min(...)` | ✅ |

### 9.4 下载

| 功能 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| PDF 下载 `downloadpods` | ✅ | ✅ `downloadPdf` | ✅ |
| PDF URP 备用 `downloadpods-urp` | ✅ | ✅ | ✅ |
| 下载当前图片 | ✅ | ✅ `downloadCurrent` | ✅ |
| 下载当前图片失败 → alert | ✅ → 见 **E-10** | `catch { alert(t('errorDownloadImage')) }` → 见 **E-10** | ✅ 已修复（D-10） |
| 下载全部图片（ZIP）| ✅ | ✅ `downloadAll`（JSZip）| ✅ |
| 下载全部图片失败 → alert | ✅ → 见 **E-11** | `catch { alert(t('errorDownloadZip')) }` → 见 **E-11** | ✅ 已修复（D-10） |

### 9.5 水印

| 功能 | Shortcoder | React | 状态 |
|------|------------|-------|------|
| URP 图片添加水印 | ✅ canvas | ✅ `lib/utils/watermark.ts` | ✅ |
| 水印数据来源（倒序找第一个有 lat/lng 的 spath item）| ✅ | ✅ `resolveWatermarkData` | ✅ |
| 水印 canvas 失败 → 静默降级显示原图 | ✅ `showOriginalImage()`，不 alert | ✅ 静默降级 | ✅ |
| 水印图片下载失败 → alert | ✅ → 见 **E-12** | `catch: alert(t('errorDownloadWatermark'))` → 见 **E-12** | ✅ 已修复（D-11） |
| 水印图片 img 加载失败 → alert | ✅ → 见 **E-13** | `catch: alert(t('errorLoadWatermark'))` → 见 **E-13** | ✅ 已修复（D-11） |

---

## 十、已归档功能（Shortcoder 注释，React 同样不实现）

| 功能 | 说明 |
|------|------|
| state 230/235 退件 POD | shortcoder 已注释 `returnPodTemplate`，React 同样不实现 |
| 旧版 PHP 代理 `/uniapi/track.php` | 已废弃，两边均不使用 |

---

## 差异汇总与风险评级

| # | 差异点 | 状态 |
|---|--------|------|
| **D-1** | ~~无 spath 的 valid_tno 降级为 invalid~~ | ✅ 已修复 |
| **D-2** | state 190：Shortcoder 黄色点无文字；React 显示 Step 0 "Label Created" | 🟡 待产品确认 |
| **D-3 / D-4** | ~~Download POD 按钮~~ | ✅ 设计关闭（统一走 View → PodModal 内下载） |
| **D-5** | 过期 EDD 仍显示旧日期；无 "Today" 特殊处理 | 🟡 待修复（见 E-14） |
| **D-6** | EddBlock.tsx 是 dead code（含完整过期判断逻辑） | 🟡 待处理（与 D-5 一并解决） |
| **D-7** | ~~track() 网络异常无提示~~ | ✅ 已修复 |
| **D-8** | ~~EDD 无 country === 'US' 显式检查~~ | ✅ 已修复 |
| **D-9** | ~~ZipModal 空 zip 提交静默~~ | ✅ 已修复 |
| **D-10** | ~~下载图片/ZIP 失败无 alert~~ | ✅ 已修复 |
| **D-11** | ~~水印下载/加载失败无 alert~~ | ✅ 已修复 |
| **D-12** | ~~ZipModal download 分支错误处理缺失~~ | ✅ 已修复 |
| **D-13** | ~~Delivered 日期格式错误、无时间行~~ | ✅ 已修复 |

---

## 结论

**核心 API 逻辑（请求结构、并发策略、URP fallback、仓库公告、拼箱、POD 导航、水印降级）与 Shortcoder 完全一致。**

**已修复（11 项）：** D-1 / D-3 / D-4 / D-7 / D-8 / D-9 / D-10 / D-11 / D-12 / D-13

**待处理（2 项）：**

| # | 问题 | 影响 |
|---|------|------|
| **D-5 / D-6** | 过期 EDD 仍显示旧日期（应降级为 "Estimated delivery is currently unavailable."）；EddBlock.tsx dead code 含完整实现可直接复用 | 🟡 中：US 订单超期未送达时用户看到错误日期 |
| **D-2** | state 190 显示 Step 0 "Label Created"；Shortcoder 仅显示黄色点无文字 | 🟡 中：需产品确认语义是否符合预期 |
