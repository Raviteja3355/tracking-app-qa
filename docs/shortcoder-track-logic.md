# Shortcoder `track()` 完整逻辑文档

> 来源文件：`docs/shortcoder/tracking_form_multi_en(PROD).html`
> 涉及函数：`track()` / `fetchEDD()` / `trackRes()` / `renderEDDBlock()` / `getNotice()` / `trackTickets()` / `validateURPTrackingNo()`

---

## 一、页面初始化

页面加载完成后，jQuery `ready` 事件执行：

1. 调用 `trackingHideDetail()` 隐藏上次结果区域
2. 监听 `#input-track` 的 `change` 事件 → 触发时再次隐藏结果区
3. 读取 URL 参数 `?no=`，如果存在且不为空：
   - 将值填入 `#input-track`
   - 立即调用 `track()` 自动查询

---

## 二、`track()` — 主流程

### 2.1 清理上一次状态

```
hideExceedAlert()       → 隐藏超量/API错误 alert
hideAlert()             → 隐藏"请输入单号" alert
trackingHideDetail()    → 隐藏结果列表、标题、进度条
jQuery(".tracking-images").html("")  → 清空图片区域
```

### 2.2 读取并标准化输入

```
读取 #input-track 的值
→ 换行符（\r\n / \r / \n）替换为逗号
→ 任意空白（空格、制表符）替换为逗号
→ 全部转大写
→ 检查是否为空：空 → 显示 #tracking-alert，return
→ 拆分：tnoArray = no.split(",").filter(t => t.trim() !== "")
```

示例输入：
```
YT2312345678
YT2312345679
```
标准化后：`"YT2312345678,YT2312345679"`

### 2.3 并发启动 EDD 请求

```js
const eddPromise = fetchEDD(tnoArray)  // 立即发出，不等待
jQuery("#loader-group").show()         // 显示 loading
```

EDD 请求和 Tracking 请求同时发出，互不阻塞。

### 2.4 发出 Tracking API 请求

```
GET https://delivery-api.uniuni.ca/cargo/trackinguniuninew
    ?id={逗号分隔大写单号}
    &key=SMq45nJhQuNR3WHsJA6N
```

**错误回调：**
- 网络错误 → 显示 `#tracking-alert`，隐藏 loader，return

### 2.5 成功回调：检查 response

```
response 为 null / undefined
response.status !== "SUCCESS"
→ 显示 #tracking-exceed-alert，隐藏 loader，return
```

正常继续：
```js
resValid   = response.data.valid_tno     // 有效单号数组
resInvalid = response.data.invalid_tno   // 无效单号（逗号分隔字符串）
```

全局变量 `currentResValid = resValid`（供后续 POD 弹窗使用）

### 2.6 特殊场景：URL 带 zip 参数

```
条件：resValid.length === 1 && URL 包含 "zip="
→ isZipLink = true
→ zip = URL.split("zip=")[1]
→ await getOrderImage(no, zip)   ← 直接打开 POD 图片弹窗
```

用途：分享链接带邮编，打开页面后直接显示签名照片。

### 2.7 等待 EDD 并发渲染结果卡片

```js
const eddMap = await eddPromise
// eddMap 结构：{ "YT2312345678": { delivery_estimate: {...}, edd_enabled: true }, ... }

results = await Promise.all(
  resValid.map((res, i) =>
    trackRes(res, i, res.urlType, false, undefined, eddMap[res.tno])
  )
)
trackingList = results.join("")
```

所有卡片**并发渲染**，不按顺序等待。

### 2.8 构建 Excel 导出数据

遍历每个 `resValid`，分两种情况：

**普通单号（非拼箱，`!res.master_tno`）：**

条件：`res.spath_list.length > 0`（有路径才写入导出）

| Excel 列 | 数据来源 |
|---|---|
| tno | `res.tno` |
| city | `spath_list[最后].pathAddress` |
| latest_time | `spath_list[最后].dateTime.localTime` |
| latest_track | `spath_list[最后].pathInfo` |
| tracking_info | `res.full_spath_info` |
| edd_date | 仅 US + `edd_enabled:true` + 有日期，否则 `"N/A"` |
| edd_time_start | 同上，12小时制，否则 `"N/A"` |
| edd_time_end | 同上，否则 `"N/A"` |

**拼箱单号（`res.master_tno` 存在）：**

- 遍历 `res.orders_list` 中的每个子单
- 每个子单独立写一行，字段来源同上，EDD 按子单 tno 查 eddMap
- 同时对每个子单 tno 调用 `trackTickets(res, i, false, tno)` 渲染子单卡片

**无路径情况（`spath_list.length === 0`）：**

- 将该单号追加到 `resInvalid` 字符串，当作无效单号处理

### 2.9 渲染无效单号区块

```
resInvalid 存在 → 拆分为数组
→ 每个单号生成一个 bullet 行
→ 拼入 inValidTemplate（红色警告卡片，含 Customer Service 链接）
```

### 2.10 注入 DOM 并显示结果

```js
jQuery("#excel-table-body").html(exportList)       // Excel 数据写入隐藏表格

if (resInvalid) {
  jQuery(".tracking-list").html(trackingList + inValidTemplate)
} else {
  jQuery(".tracking-list").html(trackingList)
}

jQuery("#parcel-overall-title-num-large").html(`${resValid.length} Tracking result(s)`)

// 显示结果区各元素
jQuery(".content-small").css("display", "block")
jQuery("#tracking-detail").show()
jQuery("#parcel-overall-title-num-large").show()
jQuery("#excel-table").show()

// 如果不是 zip 链接才隐藏 loader（zip 链接要等图片加载）
if (!isZipLink) jQuery("#loader-group").hide()

// 平滑滚动到结果区
document.getElementById("tracking-detail").scrollIntoView({ behavior: "smooth", block: "start" })
```

---

## 三、`fetchEDD()` — 预计送达日期

```
POST https://prm-api.uniuni.com/version2/orders/edd_information
Body: { key: edd_api_key, tnos: string[] }
```

**Response 结构：**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "tno": "YT2312345678",
      "edd_enabled": true,
      "delivery_estimate": {
        "estimated_delivery_date": "2024-01-15",
        "estimated_delivery_time_start": "09:00:00",
        "estimated_delivery_time_end": "21:00:00",
        "timezone": "America/New_York"
      }
    }
  ]
}
```

**返回值：** `{ tno → { delivery_estimate, edd_enabled } }` 映射表

**失败处理：** 任何错误（网络、解析、status 非 SUCCESS）→ 静默返回 `{}`，不中断主流程

---

## 四、`trackRes()` — 单张卡片渲染

### 4.1 函数签名

```js
async function trackRes(resValid, index, type, isPieces, pieceIndex, eddData)
```

| 参数 | 含义 |
|---|---|
| resValid | 单个订单数据对象 |
| index | 在结果列表中的位置（0-based） |
| type | `res.urlType`（区分 ltian 等特殊类型） |
| isPieces | 是否是拼箱子单 |
| pieceIndex | 拼箱时子单序号 |
| eddData | `{ delivery_estimate, edd_enabled }` |

### 4.2 卡片顶部（overview）状态点颜色逻辑

**第一优先级：state 190**

```
state === 190 AND validateURPTrackingNo(tno) AND events 中有 pathInfo==="Delivered"
→ 使用 overviewTemplateDelivered（含 Download POD 按钮）
→ 绿色点（item-dot-overview-green）

state === 190（其他情况）
→ 普通 overviewTemplate
→ 黄色点（item-dot-overview-yellow）
```

**第二优先级：state 203**

```
state === 203 AND country === "CA"
→ 使用 overviewTemplateDelivered（含 Download POD 按钮）
→ 绿色点

state === 203 AND country !== "CA"（即 US）
→ 普通 overviewTemplate（无 Download POD 按钮！）
→ 绿色点
```

**默认：其他 state**

```
→ 普通 overviewTemplate
→ 蓝色点（item-dot-overview-blue）
```

**第三优先级（try/catch 内）：`new_tno` 覆盖规则**

```
resValid.hasOwnProperty("new_tno")
AND spath_list 最后一条 pathInfo.trim().toLowerCase() === "delivered"
→ 切换为 overviewTemplateDelivered

  如果此时 state === 190：黄色点（不显示 Download POD 按钮的那种）
  否则：蓝色点 + 显示 Download POD 按钮（通过 {item_tracking_no_index}）
```

> 注意：这一段逻辑会**覆盖**上面的颜色，因为是后执行的字符串替换。

### 4.3 Detail ID 命名规则

```
普通单：detail_{index}             如 detail_0
拼箱子单：detail_{index}_{pieceIndex}  如 detail_0_2
```

第一张卡片（index=0 或 pieceIndex=0）用 CSS class `overview-first`，其余用 `overview`。

### 4.4 时间线渲染（`spath_list` 倒序遍历）

从 `startIndex = spath_list.length - 1` 倒序到 0，每个 spath item 生成一行时间线。

**时间格式选择逻辑：**

| 条件 | 时间字段 | 格式函数 | 日期附注 |
|---|---|---|---|
| `item.state === 192 或 198` | `item.pathTime` | `formatTimeCST()` | 正常 |
| `item.state === 213` AND 是最新条目 AND 距今超7天 | `item.pathTime` | `formatTime()` | 附加 Customer Service 联系提示 |
| `item.state === 213`（未超7天 或 非最新） | `item.pathTime` | `formatTime()` | 正常 |
| `item.state === 203` AND `item.pathTime` 存在 | `item.pathTime` | `formatTime()` | 使用 `deliveredDetailTemplate`（含 View POD 链接）|
| `item.state === 203` AND `item.pathTime` 不存在 | `item.dateTime.localTime` split | 直接分割 | 使用普通 detailTemplate |
| URP 单号 AND `!item.state` AND `item.pathInfo === "Delivered"` | `item.dateTime.localTime` split | 直接分割 | 使用 `deliveredDetailTemplate` |
| `!item.pathTime` AND (`type === "ltian"` 或 `!item.time`) | `item.dateTime.localTime` split | 直接分割 | 正常 |
| `!item.pathTime` AND `item.time` 存在 | `item.time` + `item.content` + `item.location` | `formatTimeStrCST()` | 正常 |
| `item.state === 190` | `item.pathTime` | `formatTime()` | 日期后追加 `" (UTC)"` |
| 默认 | `item.pathTime` | `formatTime()` | 正常 |

**时间线点样式规则：**

- 最新一条（`i === startIndex`）：橙色实心圆（`dot-border-current`）+ 隐藏对勾
- 其他条目：对勾图标（`dot-border`）+ 隐藏实心圆
- 最早一条（`i === 0`）：`path-description-last`（去掉底部竖线）

### 4.5 EDD 区块插入

```js
const eddResult = renderEDDBlock(resValid, eddData, index)
eddBlock = eddResult.html

// 最终拼接结构：
if (eddBlock) {
  detailList = "<div>" + eddBlock + detailList + contactTemplate + "</div>"
} else {
  detailList = "<div>" + detailList + contactTemplate + "</div>"
}
```

EDD 区块位于时间线**上方**，Contact Customer Service 链接位于时间线**下方**。

### 4.6 获取仓库公告

```js
let noticeTemplate = await getNotice(data.length, resValid)
// 拼接到 detail 最顶部（在 EDD 区块之前）
detailList = prefixTemplate + noticeTemplate + detailList
```

### 4.7 最终返回

```js
return overviewTemplate + detailList
```

---

## 五、`renderEDDBlock()` — EDD 区块 HTML

**前置条件（不满足则返回空字符串）：**
- `resValid.country !== "US"` → 返回空（CA 订单不显示 EDD）
- `!eddData || !eddData.edd_enabled` → 返回空

**四种显示状态（按优先级）：**

### 状态 A：已送达（Delivered）

```
判断条件（任意一个）：
  - resValid.state === 203
  - resValid.state === 228
  - validateURPTrackingNo(tno) AND events 中有 pathInfo === "Delivered"

→ 在 spath_list 中找第一个 delivered 的 item（state 203/228 或 URP Delivered）
→ 读取 item.pathTime（优先）或 item.dateTime.localTime
→ 显示：
    标签：Delivered
    日期：Thursday, April 09
    时间：at 3:45 P.M.

若找不到送达时间 → 降级到状态 D
```

### 状态 B：未入网（Not yet received）

```
判断条件：
  resValid.state === 190 OR resValid.state === 1870

→ 显示：
  "Estimated delivery will be available once your parcel
   arrives at UniUni's facility."
```

### 状态 C：有有效 EDD（In Transit with EDD）

```
判断条件：
  有 delivery_estimate.estimated_delivery_date
  AND 该日期 >= 今天（以包裹所在时区判断）

→ 显示：
    标签：Estimated Delivery
    日期：Today / Monday, January 15（今天显示 Today）
    声明：Delivery date and time are estimates only...

注意：不显示时间窗口（time_start / time_end 只用于 CSV 导出）
```

### 状态 D：EDD 不可用

```
所有其他情况（EDD 过期、无数据等）

→ 显示：
  "Estimated delivery is currently unavailable."
```

---

## 六、`getNotice()` — 仓库公告横幅

### 6.1 触发条件

```
pathLength（spath_list.length）> 0
AND spath_list[最后一条].warehouse > 0（warehouse 字段为非零正整数）
```

### 6.2 API 请求

```
warehouse 值 + 100000 = warehouseStr（例如 17 → 100017）

国家判断：
  CA → driver_app_domain_ca + "/messages/inbox/{warehouseStr}/3"
  US → driver_app_domain_us + "/messages/inbox/{warehouseStr}/3"
```

### 6.3 渲染

```
response.biz_data 为数组
→ 遍历每条 notice，每条含 title + content
→ 生成红色警告图标 + 标题 + 正文
→ 多条公告叠加显示

无公告（biz_data 为空）或请求失败 → 返回空字符串
```

---

## 七、`trackTickets()` — 拼箱单卡片

### 触发条件

`resValid.master_tno` 存在时，在 `track()` 中对每个子单 tno 调用：

```js
res.selected_tno.split(",").forEach(tno => {
  trackingList += trackTickets(res, i, false, tno)
})
```

### 功能

1. 保存全局状态：`isTicketGlobal[index]`、`ticketDetailList[index]`、`ticketMasterList[index]`
2. 渲染拼箱顶部卡片（显示"1 of N piece shipment"）
3. 状态点颜色：
   - `state === 190` → 黄色
   - `state === 203` → 绿色
   - 其他 → 蓝色
4. 并发调用 `orders_list` 中所有子单的 `trackRes(order, index, order.urlType, true, i)`

---

## 八、`validateURPTrackingNo()` — URP 单号判断

```js
const tnoRegex = /^UR\d{17}$/
return tnoRegex.test(tno)
```

**URP 单号格式：** `UR` 开头 + 17位数字，共19位

URP 单号在多处有特殊逻辑：
- state 190 + events 含 Delivered → 视为已送达（绿色）
- POD 请求使用备用接口 `getsignaturenew-urp`
- 时间线中无 state 的 item 且 pathInfo==="Delivered" → 使用 deliveredDetailTemplate

---

## 九、完整调用链

```
track()
├── fetchEDD(tnoArray)                    ← 并发启动
├── jQuery.ajax(tracking API)
│   └── success:
│       ├── [条件] getOrderImage(no, zip)  ← URL 带 zip 时
│       ├── await eddPromise              ← 等待 EDD 结果
│       └── Promise.all(resValid.map → trackRes())
│           └── trackRes(res, i, ...)
│               ├── renderEDDBlock(resValid, eddData, index)
│               ├── [倒序遍历 spath_list] → 生成时间线 HTML
│               └── getNotice(pathLength, resValid)
│                   └── jQuery.ajax(driver_app/messages/inbox/{id}/3)
│
└── [拼箱] trackTickets(res, i, false, tno)
    └── Promise.all(orders_list.map → trackRes(order, ...))
```

---

## 十、已废弃逻辑（保留注释，未启用）

| 功能 | 状态 | 说明 |
|---|---|---|
| `getOrderImageReturnPod()` | 已注释 | 退件（state 230/235）的 POD 查看入口，模板 `returnPodTemplate` 已注释 |
| spath 中 state 230/235 分支 | 已注释 | 曾在时间线渲染中显示"View Returned Parcel POD"链接 |
| `/uniapi/track.php` | 已注释 | 旧版本 PHP 代理接口，现在直连 delivery-api |

---

## 十一、关键业务规则速查

| 规则 | 结论 |
|---|---|
| US 订单且 edd_enabled:false | 不显示 EDD 区块 |
| CA 订单 | 一律不显示 EDD 区块 |
| state 190 普通单号 | 黄色，不显示 POD |
| state 190 + URP + events Delivered | 绿色，显示 Download POD |
| state 203 CA | 绿色，显示 Download POD |
| state 203 US | 绿色，**不显示** Download POD 按钮（overview 层） |
| new_tno + spath 最后 Delivered + state≠190 | 切换为 Delivered 卡片，显示 Download POD，**蓝色点** |
| state 192/198 时间 | 使用 CST 格式（formatTimeCST） |
| state 190 时间 | 日期后追加 "(UTC)" |
| state 213 超7天未更新（最新条目） | 显示 Customer Service 联系提示 |
| warehouse 字段 | +100000 后请求公告 API |
