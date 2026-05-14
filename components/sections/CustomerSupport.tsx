"use client";

import { useState, useEffect, useRef } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { supportCfg } from "@/lib/api/config";
import { Support } from "@/lib/constants";
import type { ContactReason } from "@/lib/types";
import FormSelect from "@/components/ui/FormSelect";

const CONTACT_REASONS: Array<{ value: ContactReason; labelKey: string }> = [
  { value: "Address Correction", labelKey: "reasonAddressCorrection" },
  { value: "Complaint (Delivery)", labelKey: "reasonComplaintDelivery" },
  { value: "Complaint (Driver)", labelKey: "reasonComplaintDriver" },
  { value: "Delivery Inquiry", labelKey: "reasonDeliveryInquiry" },
  { value: "Lost Parcel", labelKey: "reasonLostParcel" },
  { value: "Second Delivery", labelKey: "reasonSecondDelivery" },
];

const DETAILS_MAP: Record<string, Array<{ value: string; labelKey: string }>> = {
  "Address Correction": [
    { value: "Update Address or Contact Information", labelKey: "detailUpdateAddressContact" },
  ],
  "Complaint (Delivery)": [
    { value: "Report a Damaged or Mishandled Package", labelKey: "detailReportDamagedPackage" },
    { value: "Failed Delivery Attempt Inquiry", labelKey: "detailFailedDeliveryAttempt" },
    { value: "Missing or Incorrect Items", labelKey: "detailMissingIncorrectItems" },
    { value: "Received Unexpected Package", labelKey: "detailUnexpectedPackage" },
    { value: "Other Delivery Issues", labelKey: "detailOtherDeliveryIssues" },
  ],
  "Complaint (Driver)": [
    { value: "Failure to Follow Delivery Instructions", labelKey: "detailFailureFollowInstructions" },
    { value: "Late or No Communication from the Driver", labelKey: "detailLateNoCommunication" },
    { value: "Report A Proof of Delivery Photo Issue", labelKey: "detailPodPhotoIssue" },
    { value: "Feedback on Driver", labelKey: "detailFeedbackDriver" },
    { value: "Other Driver Issues", labelKey: "detailOtherDriverIssues" },
  ],
  "Delivery Inquiry": [
    { value: "Rejected Delivery Attempt", labelKey: "detailRejectedDelivery" },
    { value: "Failed Delivery Notification", labelKey: "detailFailedNotification" },
    { value: "Update Delivery Instructions", labelKey: "detailUpdateInstructions" },
    { value: "ETA Request", labelKey: "detailEtaRequest" },
    { value: "Proof of Delivery Request", labelKey: "detailPodRequest" },
    { value: "Return Package", labelKey: "detailReturnPackage" },
    { value: "Other Delivery Inquiries", labelKey: "detailOtherDeliveryInquiries" },
  ],
  "Lost Parcel": [
    { value: "Delivered to Wrong Address", labelKey: "detailDeliveredWrongAddress" },
    { value: "Lost, Stolen, or Missing Parcel", labelKey: "detailLostStolenMissing" },
    { value: "Other Lost Parcel Issues", labelKey: "detailOtherLostParcel" },
  ],
  "Second Delivery": [
    { value: "Book Second Delivery", labelKey: "detailBookSecondDelivery" },
  ],
};

const PRIORITY_MAP: Record<string, string> = {
  "Complaint (Delivery)": "1",
  "Complaint (Driver)": "1",
  "Lost Parcel": "1",
  "Address Correction": "2",
};

const CF_FIELD_MAP: Record<string, string> = {
  "Address Correction": "cf_address_correction",
  "Complaint (Delivery)": "cf_complaint_delivery",
  "Complaint (Driver)": "cf_complaint_driver",
  "Delivery Inquiry": "cf_delivery_inquiry",
  "Lost Parcel": "cf_lost_parcel",
  "Second Delivery": "cf_second_delivery",
};


// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2.5 flex items-center gap-1">
      <span className="text-[16px] font-semibold text-uni-black">{label}</span>
      {required && <span className="text-uni-red">*</span>}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded border border-uni-input-border bg-white px-3.5 text-[15px] text-uni-black focus:border-brand focus:shadow-[0_0_0_3px_rgba(255,143,28,0.12)] focus:outline-none";



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
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60">
      <div className="mx-4 max-w-sm rounded-[20px] bg-white p-8 text-center shadow-glow">
        <p className="text-[15px] text-uni-black">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 cursor-pointer rounded-[10px] px-10 py-3.5 text-[16px] font-medium text-white transition-opacity hover:opacity-90 bg-brand-gradient"
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
        `${supportCfg.territoriesUrl}?country=${country}`,
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
    if (file.size > Support.maxFileSizeMb * 1024 * 1024) {
      setModal(t("errorFileTooLarge"));
      e.target.value = "";
      return;
    }
    if (!(Support.allowedFileTypes as readonly string[]).includes(file.type)) {
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

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

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
        form.append("responder_id", String(supportCfg.agentId));
        form.append("group_id", String(supportCfg.groupId));
        if (cfField) form.append(`custom_fields[${cfField}]`, incident);
        const res = await axios.post<{ status: string }>(supportCfg.ticketUrl, form, {
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
          responder_id: supportCfg.agentId,
          group_id: supportCfg.groupId,
          custom_fields: {
            cf_country: country,
            cf_tracking_number: trackingNumber || "000",
            [country === "Canada" ? "cf_canada" : "cf_usa"]: warehouse,
            ...(cfField ? { [cfField]: incident } : {}),
          },
        };
        const res = await axios.post<{ status: string }>(supportCfg.ticketUrl, body);
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
      className="relative w-full py-15 pb-25 max-[720px]:py-10 max-[720px]:pb-17.5 bg-section-gradient"
    >
      <div className="mx-auto max-w-280 px-8 max-[720px]:px-5">
        <div className="mx-auto max-w-150">
          <h2
            className="mb-4 text-[36px] font-semibold text-uni-black max-[720px]:text-[28px] tracking-[-0.72px] leading-[1.1]"
          >
            {t("supportHeading")}
          </h2>
          <p className="mb-8 text-[16px] leading-relaxed text-uni-body">
            {t("supportIntro")}
          </p>

          {/* Card */}
          <form
            onSubmit={handleSend}
            noValidate={false}
            className="rounded-[20px] bg-white px-15 py-12.5 max-[720px]:px-6 max-[720px]:py-8 shadow-glow"
          >
            {/* Contact Reason */}
            <div className="mb-5">
              <FieldLabel label={t("labelContactReason")} required htmlFor="contact-reason" />
              <FormSelect
                id="contact-reason"
                value={reason}
                onChange={(v) => onReasonChange(v as ContactReason)}
                options={CONTACT_REASONS.map((r) => ({ value: r.value, label: t(r.labelKey) }))}
                placeholder={t("selectPlaceholder")}
                required
                aria-label={t("labelContactReason")}
              />
            </div>

            {/* Details — options change based on selected reason */}
            <div className="mb-5">
              <FieldLabel label={t("labelDetails")} required htmlFor="contact-details" />
              <FormSelect
                id="contact-details"
                value={incident}
                onChange={setIncident}
                options={(DETAILS_MAP[reason] ?? []).map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
                placeholder={t("selectPlaceholder")}
                disabled={!reason}
                required
                aria-label={t("labelDetails")}
              />
            </div>

            {/* First + Last Name */}
            <div className="mb-5 grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
              <div>
                <FieldLabel label={t("labelFirstName")} required htmlFor="first-name" />
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("placeholderFirstName")}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <FieldLabel label={t("labelLastName")} required htmlFor="last-name" />
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("placeholderLastName")}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <FieldLabel label={t("labelEmail")} required htmlFor="support-email" />
              <input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholderEmail")}
                className={inputClass}
                required
              />
            </div>

            {/* Tracking Number */}
            <div className="mb-5">
              <FieldLabel label={t("labelTrackingNumber")} required htmlFor="tracking-number" />
              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="JK100000000000"
                className={inputClass}
                required
              />
            </div>

            {/* Country */}
            <div className="mb-5">
              <FieldLabel label={t("labelCountry")} required htmlFor="support-country" />
              <FormSelect
                id="support-country"
                value={country}
                onChange={setCountry}
                options={[
                  { value: "Canada", label: t("countryCanada") },
                  { value: "USA", label: t("countryUsa") },
                ]}
                placeholder={t("countryPlaceholder")}
                required
                aria-label={t("labelCountry")}
              />
            </div>

            {/* Province / State */}
            {states.length > 0 && (
              <div className="mb-5">
                <FieldLabel label={t("labelProvinceState")} required htmlFor="province-state" />
                <FormSelect
                  id="province-state"
                  value={selectedState}
                  onChange={onStateChange}
                  options={states.map((s) => ({ value: s, label: s }))}
                  aria-label={t("labelProvinceState")}
                />
              </div>
            )}

            {/* City / Warehouse */}
            {cities.length > 0 && (
              <div className="mb-5">
                <FieldLabel label={t("labelLocation")} required htmlFor="city-warehouse" />
                <FormSelect
                  id="city-warehouse"
                  value={warehouse}
                  onChange={setWarehouse}
                  options={cities.map((c) => ({ value: c, label: c }))}
                  aria-label={t("labelLocation")}
                />
              </div>
            )}

            {/* How we can help */}
            <div className="mb-7">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <label htmlFor="how-can-help" className="text-[16px] font-semibold text-uni-black">
                    {t("labelHowCanWeHelp")}
                  </label>
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
                id="how-can-help"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                placeholder={t("placeholderHelpText")}
                className="min-h-30 w-full resize-y rounded border border-uni-input-border bg-white px-3.5 py-2.5 text-[15px] text-uni-black focus:border-brand focus:shadow-[0_0_0_3px_rgba(255,143,28,0.12)] focus:outline-none"
                required
              />
              <p className="mt-1.5 text-[12px] text-uni-muted">
                {t("fileHelpText")}
              </p>
            </div>

            {/* Send button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-[10px] px-10 py-3.5 text-[16px] font-medium text-white transition-all hover:-translate-y-px hover:shadow-[4px_6px_14px_0_rgba(255,106,19,0.3)] disabled:cursor-not-allowed disabled:opacity-60 bg-brand-gradient"
              >
                {loading ? t("btnSending") : t("btnSend")}
              </button>
            </div>
          </form>
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
