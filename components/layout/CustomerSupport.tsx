"use client";

import { useState, useEffect, useRef } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

type ContactReason =
  | ""
  | "Questions about my deliveries"
  | "Delivery issue"
  | "Damaged package"
  | "Missing items"
  | "Other";

const CONTACT_REASONS_DISPLAY: Array<{
  value: ContactReason;
  labelKey: string;
}> = [
  { value: "Questions about my deliveries", labelKey: "reasonDeliveries" },
  { value: "Delivery issue", labelKey: "reasonDeliveryIssue" },
  { value: "Damaged package", labelKey: "reasonDamagedPackage" },
  { value: "Missing items", labelKey: "reasonMissingItems" },
  { value: "Other", labelKey: "reasonOther" },
];

const DETAIL_OPTIONS_DISPLAY: Array<{ value: string; labelKey: string }> = [
  { value: "ETA inquiry", labelKey: "detailEtaInquiry" },
  { value: "Update delivery info", labelKey: "detailUpdateInfo" },
  { value: "Failed delivery", labelKey: "detailFailedDelivery" },
  { value: "Wrong address", labelKey: "detailWrongAddress" },
];

const PRIORITY_MAP: Record<string, string> = {
  "Damaged package": "1",
  "Missing items": "1",
  "Delivery issue": "2",
};

const CF_FIELD_MAP: Record<string, string> = {
  "Questions about my deliveries": "cf_delivery_inquiry",
  "Delivery issue": "cf_delivery_inquiry",
  "Damaged package": "cf_complaint_delivery",
  "Missing items": "cf_general_inquiry",
  Other: "cf_general_inquiry",
};

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_MB = 2;
const TICKET_API = "https://map.cluster.uniexpress.org/business/ticket";
const TERRITORIES_API = "https://delivery-api.uniuni.ca/cargo/territories";
const GROUP_ID = 151000026065;
const AGENT_ID = 151000701681;

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-1">
      <span className="text-[16px] font-semibold text-uni-black">{label}</span>
      {required && <span className="text-uni-red">*</span>}
    </div>
  );
}

const inputClass =
  "support-field h-11 w-full rounded border border-uni-input-border bg-white px-3.5 text-[15px] text-uni-black";

const selectClass = `${inputClass} support-select`;

function Modal({
  message,
  onClose,
  btnLabel,
}: {
  message: string;
  onClose: () => void;
  btnLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div
        className="mx-4 max-w-sm rounded-[20px] bg-white p-8 text-center"
        style={{ boxShadow: "0 0 40px 0 #D4EFF7" }}
      >
        <p className="text-[15px] text-uni-black">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 cursor-pointer rounded-[10px] px-10 py-3.5 text-[16px] font-medium text-white transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(to top, #FF6A13 0%, #FF8F1C 100%)",
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerSupport() {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ContactReason>("");
  const [incident, setIncident] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [country, setCountry] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [warehouse, setWarehouse] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Territory data: state → cities map
  const [relationship, setRelationship] = useState<Record<string, string[]>>(
    {},
  );

  // Fetch territories when country changes
  useEffect(() => {
    axios
      .get<{ data: Array<{ state: string; cities: string[] }> }>(
        `${TERRITORIES_API}?country=${country}`,
      )
      .then(({ data }) => {
        if (!data?.data?.length) return;
        const rel: Record<string, string[]> = {};
        data.data.forEach((item) => {
          rel[item.state] = item.cities;
        });
        setRelationship(rel);
        setStates(Object.keys(rel));
        const firstState = data.data[0].state;
        setSelectedState(firstState);
        setCities(data.data[0].cities ?? []);
        setWarehouse(data.data[0].cities?.[0] ?? "");
      })
      .catch(() => {});
  }, [country]);

  function onStateChange(s: string) {
    setSelectedState(s);
    const c = relationship[s] ?? [];
    setCities(c);
    setWarehouse(c[0] ?? "");
  }

  function onReasonChange(r: ContactReason) {
    setReason(r);
    setIncident("");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setModal(t("errorFileTooLarge"));
      e.target.value = "";
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setModal(t("errorFileType"));
      e.target.value = "";
      return;
    }
    setAttachment(file);
  }

  function clearForm() {
    setReason("");
    setIncident("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setTrackingNumber("");
    setContent("");
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSend() {
    if (
      !reason ||
      !incident ||
      !firstName ||
      !lastName ||
      !email ||
      !content ||
      !trackingNumber
    ) {
      setModal(t("errorFormIncomplete"));
      return;
    }

    const priority = PRIORITY_MAP[reason] ?? "3";
    const cfField = CF_FIELD_MAP[reason];
    const name = `${firstName} ${lastName}`;

    setLoading(true);
    try {
      let response: { status: string };

      if (attachment) {
        const form = new FormData();
        form.append("attachments[]", attachment);
        form.append("subject", reason);
        form.append("description", content);
        form.append("status", "2");
        form.append("priority", priority);
        form.append("name", name);
        form.append("type", reason);
        form.append("email", email);
        form.append("custom_fields[cf_country]", country);
        form.append(
          country === "Canada"
            ? "custom_fields[cf_canada]"
            : "custom_fields[cf_usa]",
          warehouse,
        );
        form.append(
          "custom_fields[cf_tracking_number]",
          trackingNumber || "000",
        );
        form.append("responder_id", String(AGENT_ID));
        form.append("group_id", String(GROUP_ID));
        if (cfField) form.append(`custom_fields[${cfField}]`, incident);
        const res = await axios.post<{ status: string }>(TICKET_API, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        response = res.data;
      } else {
        const body: Record<string, unknown> = {
          subject: reason,
          description: content,
          status: "2",
          priority,
          name,
          type: reason,
          email,
          responder_id: AGENT_ID,
          group_id: GROUP_ID,
          custom_fields: {
            cf_country: country,
            cf_tracking_number: trackingNumber || "000",
            [country === "Canada" ? "cf_canada" : "cf_usa"]: warehouse,
            ...(cfField ? { [cfField]: incident } : {}),
          },
        };
        const res = await axios.post<{ status: string }>(TICKET_API, body);
        response = res.data;
      }

      if (response?.status === "SUCCESS") {
        setModal(t("successTicketCreated"));
        clearForm();
      } else {
        setModal(t("errorTicketFailed"));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { status?: string } } })?.response
                ?.data?.status === "SUCCESS"
            ? "SUCCESS"
            : null;
      if (msg === "SUCCESS") {
        setModal(t("successTicketCreated"));
        clearForm();
      } else {
        setModal(t("errorTicketFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="support"
      className="relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5"
      style={{ background: "linear-gradient(to top, #fff 0%, #EDF4F6 100%)" }}
    >
      <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
        <div className="mx-auto max-w-150">
          <h2
            className="mb-4 text-[36px] font-semibold text-uni-black max-[720px]:text-[28px]"
            style={{ letterSpacing: "-0.72px", lineHeight: "1.1" }}
          >
            {t("supportHeading")}
          </h2>
          <p className="mb-8 text-[16px] leading-relaxed text-[#333]">
            {t("supportIntro")}
          </p>

          {/* Card */}
          <div
            className="rounded-[20px] bg-white px-15 py-12.5 max-[720px]:px-6 max-[720px]:py-8"
            style={{ boxShadow: "0 0 40px 0 #D4EFF7" }}
          >
            {/* Contact Reason */}
            <div className="mb-5">
              <FieldLabel label={t("labelContactReason")} required />
              <select
                value={reason}
                onChange={(e) =>
                  onReasonChange(e.target.value as ContactReason)
                }
                className={selectClass}
              >
                <option value="">{t("selectPlaceholder")}</option>
                {CONTACT_REASONS_DISPLAY.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div className="mb-5">
              <FieldLabel label={t("labelDetails")} required />
              <select
                value={incident}
                onChange={(e) => setIncident(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("selectPlaceholder")}</option>
                {DETAIL_OPTIONS_DISPLAY.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* First + Last Name */}
            <div className="mb-5 grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
              <div>
                <FieldLabel label={t("labelFirstName")} required />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("placeholderFirstName")}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel label={t("labelLastName")} required />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("placeholderLastName")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <FieldLabel label={t("labelEmail")} required />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholderEmail")}
                className={inputClass}
              />
            </div>

            {/* Tracking Number */}
            <div className="mb-5">
              <FieldLabel label={t("labelTrackingNumber")} required />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="JK100000000000"
                className={inputClass}
              />
            </div>

            {/* Country */}
            <div className="mb-5">
              <FieldLabel label={t("labelCountry")} required />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("countryPlaceholder")}</option>
                <option value="Canada">{t("countryCanada")}</option>
                <option value="USA">{t("countryUsa")}</option>
              </select>
            </div>

            {/* Province / State */}
            {states.length > 0 && (
              <div className="mb-5">
                <FieldLabel label={t("labelProvinceState")} required />
                <select
                  value={selectedState}
                  onChange={(e) => onStateChange(e.target.value)}
                  className={selectClass}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* City / Warehouse */}
            {cities.length > 0 && (
              <div className="mb-5">
                <FieldLabel label={t("labelLocation")} required />
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className={selectClass}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* How we can help */}
            <div className="mb-7">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[16px] font-semibold text-uni-black">
                    {t("labelHowCanWeHelp")}
                  </span>
                  <span className="text-uni-red">*</span>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-[14px] text-[#03A3D6] transition-opacity hover:opacity-75">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  {t("labelAttachment")}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
              </div>
              {attachment && (
                <span className="mb-2.5 block text-[12px] text-[#03A3D6]">
                  {attachment.name}
                </span>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                placeholder={t("placeholderHelpText")}
                className="support-field min-h-30 w-full resize-y rounded border border-uni-input-border bg-white px-3.5 py-2.5 text-[15px] text-uni-black"
              />
              <p className="mt-1.5 text-[12px] text-uni-muted">
                {t("fileHelpText")}
              </p>
            </div>

            {/* Send button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="cursor-pointer rounded-[10px] px-10 py-3.5 text-[16px] font-medium text-white transition-all hover:-translate-y-px hover:shadow-[4px_6px_14px_0_rgba(255,106,19,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(to top, #FF6A13 0%, #FF8F1C 100%)",
                }}
              >
                {loading ? t("btnSending") : t("btnSend")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          message={modal}
          onClose={() => setModal(null)}
          btnLabel={t("btnOkay")}
        />
      )}
    </section>
  );
}
