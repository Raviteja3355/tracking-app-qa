# Known Issues & Design Drift

Issues tracked here are known discrepancies between the current implementation and the
original WordPress shortcoder (`docs/shortcoder/customer_quote_form_freshdesk_en(PROD).html`),
caused by intentional or unintentional design changes during the Next.js migration.

---

## 1. CustomerSupport — Contact Reason options do not match Freshdesk ticket types

**File:** `components/layout/CustomerSupport.tsx`

**Current implementation (simplified):**
| Display label | API value sent |
|---|---|
| Questions about my deliveries | Questions about my deliveries |
| Delivery issue | Delivery issue |
| Damaged package | Damaged package |
| Missing items | Missing items |
| Other | Other |

**Original shortcoder (Freshdesk ticket `type` field):**
| Reason | Freshdesk `type` |
|---|---|
| Complaint (Delivery) | Complaint (Delivery) |
| Complaint (Driver) | Complaint (Driver) |
| Lost Parcel | Lost Parcel |
| Address Correction | Address Correction |
| Refund Request | Refund Request |
| Delivery Inquiry | Delivery Inquiry |
| General Inquiry | General Inquiry |
| Second Delivery | Second Delivery |

**Impact:** Tickets created via the new portal will have incorrect/non-standard `type` values
in Freshdesk, breaking any routing rules or reports that rely on ticket type.

---

## 2. CustomerSupport — Detail (incident) options are static, not dynamic per reason

**File:** `components/layout/CustomerSupport.tsx`

**Current implementation:** A fixed list of 4 options shown regardless of the selected
contact reason:
- ETA inquiry
- Update delivery info
- Failed delivery
- Wrong address

**Original shortcoder:** Each contact reason shows its own sub-option list.
The full mapping is:

| Reason | Incident options |
|---|---|
| Complaint (Delivery) | Report a Damaged or Mishandled Package · Failed Delivery Attempt Inquiry · Missing or Incorrect Items · Received Unexpected Package · Other Delivery Issues |
| Complaint (Driver) | Failure to Follow Delivery Instructions · Late or No Communication from the Driver · Report A Proof of Delivery Photo Issue · Feedback on Driver · Other Driver Issues |
| Lost Parcel | Delivered to Wrong Address · Lost, Stolen, or Missing Parcel · Other Lost Parcel Issues |
| Address Correction | Update Address or Contact Information |
| Refund Request | Customer Requests a Refund |
| Delivery Inquiry | Rejected Delivery Attempt · Failed Delivery Notification · Update Delivery Instructions · ETA Request · Proof of Delivery Request · Return Package · Other Delivery Inquiries |
| General Inquiry | (free text only — no sub-options) |
| Second Delivery | Book Second Delivery |

**Impact:** Wrong `custom_fields` values are written to Freshdesk tickets. Each reason maps
to a different CF field (`cf_complaint_delivery`, `cf_lost_parcel`, etc.), so incorrect
incident options mean incorrect custom field data.

---

## 3. CustomerSupport — `custom_fields` CF field mapping is incorrect

**File:** `components/layout/CustomerSupport.tsx` (`CF_FIELD_MAP` constant)

**Current mapping:**
```ts
const CF_FIELD_MAP = {
  'Questions about my deliveries': 'cf_delivery_inquiry',
  'Delivery issue':                'cf_delivery_inquiry',
  'Damaged package':               'cf_complaint_delivery',
  'Missing items':                 'cf_general_inquiry',
  'Other':                         'cf_general_inquiry',
}
```

**Correct mapping (shortcoder):**
```
Complaint (Delivery)  → cf_complaint_delivery
Complaint (Driver)    → cf_complaint_driver
Lost Parcel           → cf_lost_parcel
Address Correction    → cf_address_correction
Refund Request        → cf_refund_request
Delivery Inquiry      → cf_delivery_inquiry
General Inquiry       → cf_general_inquiry
Second Delivery       → cf_second_delivery
```

**Impact:** Ticket custom fields are written to the wrong Freshdesk CF columns.

---

## 4. CustomerSupport — Priority logic is simplified

**File:** `components/layout/CustomerSupport.tsx` (`PRIORITY_MAP` constant)

**Current implementation:** Priority is determined by reason only (3 entries).

**Original shortcoder:** Priority is determined by a combination of reason *and* incident.
For example, within `Lost Parcel`, different incident values yield different priorities
(high for "Delivered to the Wrong Address", medium for "LPC Requested", etc.).

**Impact:** Tickets may be assigned incorrect priority levels in Freshdesk.

---

## 5. CustomerSupport — E-commerce vendor field missing

**Original shortcoder:** Had a vendor select field (SHEIN / TEMU / TikTok / Other) that
was commented out at some point. Not implemented in the current portal.

**Status:** Commented out in the shortcoder source — likely intentionally dropped.
Confirm with product whether this field should be reinstated.

---

## Next Steps

These issues should be triaged with the product/ops team to decide:

- **Option A — Align with shortcoder:** Restore the original 8 contact reasons, dynamic
  incident sub-options, and correct CF field mappings. This ensures Freshdesk data integrity
  but requires i18n updates for ~25 new option strings.

- **Option B — Redesign the form:** Keep the simplified UX but update the Freshdesk CF
  mappings and priority logic to match whatever reasons are actually used.

Either way, the `type`, `custom_fields`, and `priority` values sent to
`https://map.cluster.uniexpress.org/business/ticket` must match what Freshdesk expects.
