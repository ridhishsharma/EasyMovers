"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import styles from "./vendor-operations-admin.module.css";

type VendorSummary = {
  id: string;
  vendorCode: string;
  companyName: string;
  ownerName: string;
  city: string | null;
  state: string | null;
  status: string;
  _count: {
    serviceAreas: number;
    vehicles: number;
    documents: number;
    assignedBookings: number;
  };
};
type LocationOption = {
  id: string;
  code: string;
  city: string;
  state: string;
  status: string;
};
type AreaDraft = {
  scope: "WITHIN_CITY" | "WITHIN_STATE" | "PAN_INDIA";
  locationId: string;
  pins: string;
};
type Detail = {
  vendor: VendorSummary & {
    ownerMobile: string;
    ownerEmail: string | null;
    businessType: string;
    engagementMode: "QUOTATION" | "INSTANT_RATE" | "HYBRID";
    pincode: string | null;
    serviceAreas: Array<{
      id: string;
      scope: AreaDraft["scope"];
      originCity: string | null;
      originState: string | null;
      serviceablePostalCodes: string[];
      active: boolean;
    }>;
    serviceOfferings: Array<{
      id: string;
      serviceType: string;
      title: string;
      active: boolean;
    }>;
    vehicles: Array<{
      id: string;
      registrationNumber: string;
      vehicleType: string;
      ownership: string;
      status: string;
      currentCity: string | null;
      isActive: boolean;
    }>;
    documents: Array<{
      id: string;
      documentType: string;
      documentNumber: string | null;
      fileName: string;
      fileUrl: string;
      verificationStatus: string;
      isMandatory: boolean;
      isActive: boolean;
      rejectionReason: string | null;
    }>;
    bankAccounts: Array<{
      id: string;
      bankName: string;
      accountHolderName: string;
      accountType: string;
      ifscCode: string;
      verified: boolean;
      isPrimary: boolean;
    }>;
    _count: { assignedBookings: number; quotations: number; payments: number };
  };
  locationOptions: LocationOption[];
  readiness: {
    activeServiceAreas: number;
    activeServiceOfferings: number;
    activeVehicles: number;
    verifiedMandatoryDocuments: number;
    mandatoryDocuments: number;
    verifiedBankAccounts: number;
    blockers: Array<{ code: string; message: string }>;
    operationallyReady: boolean;
    quotationEligible: boolean;
    instantRateEligible: boolean;
  };
  capabilities: { canManage: boolean; canActivate: boolean };
};
const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
const serviceTypes = [
  "HOUSEHOLD_RELOCATION",
  "OFFICE_RELOCATION",
  "CORPORATE_RELOCATION",
  "VEHICLE_TRANSPORT",
  "COMMERCIAL_GOODS",
  "WAREHOUSING",
  "PACKING_ONLY",
  "LOADING_UNLOADING",
  "INSTALLATION_UNINSTALLATION",
];

export function VendorOperationsAdmin({
  supabaseUrl,
  publishableKey,
}: {
  supabaseUrl: string;
  publishableKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useMemo(
    () =>
      supabaseUrl && publishableKey
        ? createClient(supabaseUrl, publishableKey)
        : null,
    [supabaseUrl, publishableKey],
  );
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => searchParams.get("status")?.toUpperCase() ?? "");
  const [coverage, setCoverage] = useState(() => searchParams.get("coverage")?.toUpperCase() ?? "");
  const [createdWithin, setCreatedWithin] = useState(() => searchParams.get("createdWithin") ?? "");
  const [areas, setAreas] = useState<AreaDraft[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<
    "services" | "verification" | "records"
  >("services");
  const [vehicle, setVehicle] = useState({
    registrationNumber: "",
    vehicleType: "MINI_TRUCK",
    ownership: "OWNED",
    currentCity: "",
    insuranceNumber: "",
    insuranceExpiry: "",
  });
  const [document, setDocument] = useState({
    documentType: "PAN",
    documentNumber: "",
    fileName: "",
    fileUrl: "",
    expiryDate: "",
    isMandatory: true,
  });
  const [bank, setBank] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "CURRENT",
  });
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!client) throw new Error("Office authentication is not configured.");
      const { data } = await client.auth.getSession();
      if (!data.session) {
        router.replace("/admin/login?returnTo=/admin/vendors");
        throw new Error("Office session expired.");
      }
      const response = await fetch(path, {
        ...init,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
      const payload = await response.json();
      if (!response.ok || !payload.success)
        throw new Error(payload?.error?.message || "Vendor operation failed.");
      return payload.data;
    },
    [client, router],
  );
  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setMessageSuccess(false);
    try {
      const query = new URLSearchParams({ page: "1", pageSize: "100" });
      if (search.trim()) query.set("search", search.trim());
      if (status) query.set("status", status);
      if (coverage) query.set("coverage", coverage);
      if (createdWithin) query.set("createdWithin", createdWithin);
      const data = await request(`/api/admin/vendors?${query}`);
      setVendors(data.vendors);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load vendors.",
      );
    } finally {
      setLoading(false);
    }
  }, [coverage, createdWithin, request, search, status]);
  const open = useCallback(
    async (id: string) => {
      setLoading(true);
      setMessage("");
      try {
        const detail: Detail = await request(
          `/api/admin/vendors/${encodeURIComponent(id)}`,
        );
        setSelected(detail);
        setOfferings(
          detail.vendor.serviceOfferings
            .filter((item) => item.active)
            .map((item) => item.serviceType),
        );
        setAreas(
          detail.vendor.serviceAreas
            .filter((item) => item.active)
            .map((area) => ({
              scope: area.scope,
              locationId:
                detail.locationOptions.find((location) =>
                  area.scope === "WITHIN_CITY"
                    ? location.city.toLowerCase() ===
                        area.originCity?.toLowerCase() &&
                      location.state.toLowerCase() ===
                        area.originState?.toLowerCase()
                    : location.state.toLowerCase() ===
                      area.originState?.toLowerCase(),
                )?.id || "",
              pins: area.serviceablePostalCodes.join(", "),
            })),
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load vendor readiness.",
        );
      } finally {
        setLoading(false);
      }
    },
    [request],
  );
  useEffect(() => {
    void load();
  }, [load]);
  function updateArea(index: number, patch: Partial<AreaDraft>) {
    setAreas((current) =>
      current.map((area, position) =>
        position === index ? { ...area, ...patch } : area,
      ),
    );
  }
  async function saveConfiguration(event: FormEvent) {
    event.preventDefault();
    if (!selected || loading) return;
    setLoading(true);
    setMessage("");
    try {
      await request(`/api/admin/vendors/${selected.vendor.id}/configuration`, {
        method: "PUT",
        body: JSON.stringify({
          areas: areas.map((area) => ({
            scope: area.scope,
            locationId:
              area.scope === "PAN_INDIA" ? undefined : area.locationId,
            serviceablePostalCodes: area.pins.split(/[\s,]+/).filter(Boolean),
          })),
          serviceTypes: offerings,
        }),
      });
      await open(selected.vendor.id);
      await load();
      setMessageSuccess(true);
      setMessage("Vendor service configuration saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save vendor configuration.",
      );
      setLoading(false);
    }
  }
  async function operate(body: Record<string, unknown>, success: string) {
    if (!selected || loading) return;
    setLoading(true);
    setMessage("");
    setMessageSuccess(false);
    try {
      await request(`/api/admin/vendors/${selected.vendor.id}/operations`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await open(selected.vendor.id);
      await load();
      setMessageSuccess(true);
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update vendor operations.",
      );
      setLoading(false);
    }
  }
  const editable = selected?.capabilities.canManage === true;
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>PARTNER OPERATIONS</p>
          <h1>Vendor readiness</h1>
          <span>
            Verify operational capacity before activating a moving partner.
          </span>
        </div>
        <button onClick={() => void load()}>Refresh</button>
      </header>
      <form
        className={styles.search}
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <input
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, code, owner, phone, email, city, state or service area…"
        />
        <select aria-label="Filter vendors by status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending verification</option>
        </select>
        <select aria-label="Filter vendors by service coverage" value={coverage} onChange={(event) => setCoverage(event.target.value)}>
          <option value="">All coverage</option>
          <option value="ACTIVE">Has active coverage</option>
          <option value="MISSING">Missing active coverage</option>
        </select>
        <select aria-label="Filter vendors by creation date" value={createdWithin} onChange={(event) => setCreatedWithin(event.target.value)}>
          <option value="">Any joining date</option>
          <option value="7">Added in last 7 days</option>
          <option value="30">Added in last 30 days</option>
          <option value="90">Added in last 90 days</option>
        </select>
        <button>Search</button>
      </form>
      {message && (
        <p className={messageSuccess ? styles.success : styles.error}>
          {message}
        </p>
      )}
      <div className={styles.workspace}>
        <section className={styles.list}>
          <strong>{vendors.length} vendors</strong>
          {vendors.map((vendor) => (
            <button
              key={vendor.id}
              className={
                selected?.vendor.id === vendor.id ? styles.selected : ""
              }
              onClick={() => {
                setActivePanel("services");
                void open(vendor.id);
              }}
            >
              <span>
                <b>{vendor.companyName}</b>
                <em className={styles[vendor.status]}>
                  {label(vendor.status)}
                </em>
              </span>
              <small>
                {vendor.vendorCode} · {vendor.city || "City pending"}
              </small>
              <small>
                {vendor._count.serviceAreas} areas · {vendor._count.vehicles}{" "}
                vehicles · {vendor._count.documents} documents
              </small>
            </button>
          ))}
        </section>
        <section className={styles.detail}>
          {!selected ? (
            <div className={styles.empty}>
              {loading
                ? "Loading vendors…"
                : "Select a vendor to review operational readiness."}
            </div>
          ) : (
            <>
              <div className={styles.title}>
                <div>
                  <em
                    className={
                      selected.readiness.operationallyReady
                        ? styles.ready
                        : styles.pending
                    }
                  >
                    {selected.readiness.operationallyReady
                      ? "Operationally ready"
                      : "Setup incomplete"}
                  </em>
                  <h2>{selected.vendor.companyName}</h2>
                  <p>
                    {selected.vendor.vendorCode} · {selected.vendor.ownerName} · {label(selected.vendor.engagementMode)}
                  </p>
                </div>
              </div>
              <div className={styles.cards}>
                <article>
                  <span>Service areas</span>
                  <strong>{selected.readiness.activeServiceAreas}</strong>
                </article>
                <article>
                  <span>Service offerings</span>
                  <strong>{selected.readiness.activeServiceOfferings}</strong>
                </article>
                <article>
                  <span>Active vehicles</span>
                  <strong>{selected.readiness.activeVehicles}</strong>
                </article>
                <article>
                  <span>Verified documents</span>
                  <strong>
                    {selected.readiness.verifiedMandatoryDocuments}/
                    {selected.readiness.mandatoryDocuments}
                  </strong>
                </article>
                <article>
                  <span>Verified banks</span>
                  <strong>{selected.readiness.verifiedBankAccounts}</strong>
                </article>
              </div>
              <div className={styles.next}>
                <strong>Work eligibility</strong>
                <p>Quotation: {selected.readiness.quotationEligible ? "Eligible" : "Blocked"} · Instant rate: {selected.readiness.instantRateEligible ? "Eligible" : "Not yet eligible"}</p>
                <small>Quotation vendors nominate vehicles after work award. Instant-rate and individual operators require a verified registered vehicle before activation.</small>
              </div>
              {selected.readiness.blockers.length > 0 && (
                <div className={styles.blockers}>
                  <strong>Activation blockers</strong>
                  {selected.readiness.blockers.map((blocker) => (
                    <span key={blocker.code}>{blocker.message}{selected.capabilities.canManage && <button type="button" onClick={() => setActivePanel(blocker.code.includes("SERVICE_") ? "services" : blocker.code.includes("DOCUMENT") || blocker.code.includes("PAN") || blocker.code.includes("BANK") || blocker.code.includes("VEHICLE") || blocker.code.includes("TRANSPORT") ? "verification" : "records")}>Resolve →</button>}</span>
                  ))}
                </div>
              )}
              <nav
                className={styles.vendorTabs}
                aria-label="Vendor readiness sections"
              >
                <button
                  className={activePanel === "services" ? styles.activeTab : ""}
                  onClick={() => setActivePanel("services")}
                >
                  Services
                </button>
                <button
                  className={
                    activePanel === "verification" ? styles.activeTab : ""
                  }
                  onClick={() => setActivePanel("verification")}
                >
                  Verification
                </button>
                <button
                  className={activePanel === "records" ? styles.activeTab : ""}
                  onClick={() => setActivePanel("records")}
                >
                  Operational records
                </button>
              </nav>
              {editable && activePanel === "services" && (
                <form
                  className={styles.configuration}
                  onSubmit={saveConfiguration}
                >
                  <div className={styles.configTitle}>
                    <div>
                      <h3>Service configuration</h3>
                      <span>
                        Only registered EasyMovers service locations can be
                        assigned.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAreas((current) => [
                          ...current,
                          {
                            scope: "WITHIN_CITY",
                            locationId: selected.locationOptions[0]?.id || "",
                            pins: "",
                          },
                        ])
                      }
                    >
                      Add area
                    </button>
                  </div>
                  <div className={styles.areaRows}>
                    {areas.length ? (
                      areas.map((area, index) => (
                        <div
                          className={styles.areaRow}
                          key={`${index}-${area.scope}-${area.locationId}`}
                        >
                          <select
                            aria-label={`Area ${index + 1} scope`}
                            value={area.scope}
                            onChange={(event) =>
                              updateArea(index, {
                                scope: event.target.value as AreaDraft["scope"],
                                locationId:
                                  event.target.value === "PAN_INDIA"
                                    ? ""
                                    : area.locationId,
                              })
                            }
                          >
                            <option value="WITHIN_CITY">Within city</option>
                            <option value="WITHIN_STATE">Within state</option>
                            <option value="PAN_INDIA">Pan India</option>
                          </select>
                          {area.scope !== "PAN_INDIA" && (
                            <select
                              aria-label={`Area ${index + 1} location`}
                              required
                              value={area.locationId}
                              onChange={(event) =>
                                updateArea(index, {
                                  locationId: event.target.value,
                                })
                              }
                            >
                              <option value="">
                                Select registered location
                              </option>
                              {selected.locationOptions
                                .filter(
                                  (location, position, options) =>
                                    area.scope !== "WITHIN_STATE" ||
                                    options.findIndex(
                                      (candidate) =>
                                        candidate.state === location.state,
                                    ) === position,
                                )
                                .map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {area.scope === "WITHIN_STATE"
                                      ? location.state
                                      : `${location.city}, ${location.state}`}
                                  </option>
                                ))}
                            </select>
                          )}
                          <input
                            aria-label={`Area ${index + 1} PIN codes`}
                            disabled={area.scope === "PAN_INDIA"}
                            placeholder="Optional PIN codes"
                            value={area.pins}
                            onChange={(event) =>
                              updateArea(index, {
                                pins: event.target.value.replace(
                                  /[^0-9,\s]/g,
                                  "",
                                ),
                              })
                            }
                          />
                          <button
                            type="button"
                            className={styles.remove}
                            onClick={() =>
                              setAreas((current) =>
                                current.filter(
                                  (_, position) => position !== index,
                                ),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No service areas selected.</p>
                    )}
                  </div>
                  <fieldset>
                    <legend>Service offerings</legend>
                    <div className={styles.offeringGrid}>
                      {serviceTypes.map((serviceType) => (
                        <label key={serviceType}>
                          <input
                            type="checkbox"
                            checked={offerings.includes(serviceType)}
                            onChange={(event) =>
                              setOfferings((current) =>
                                event.target.checked
                                  ? [...current, serviceType]
                                  : current.filter(
                                      (item) => item !== serviceType,
                                    ),
                              )
                            }
                          />
                          <span>{label(serviceType)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button className={styles.save} disabled={loading}>
                    {loading ? "Saving…" : "Save service configuration"}
                  </button>
                </form>
              )}
              {editable && activePanel === "verification" && (
                <section className={styles.operations}>
                  <h3>Operational verification</h3>
                  <p>
                    Add operational evidence, then verify compliance and banking
                    before activation.
                  </p>
                  <div className={styles.operationGrid}>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void operate(
                          { action: "ADD_VEHICLE", ...vehicle },
                          "Operational vehicle added.",
                        );
                      }}
                    >
                      <h4>Add vehicle</h4>
                      <input
                        required
                        placeholder="Registration number"
                        value={vehicle.registrationNumber}
                        onChange={(event) =>
                          setVehicle((current) => ({
                            ...current,
                            registrationNumber: event.target.value,
                          }))
                        }
                      />
                      <select
                        value={vehicle.vehicleType}
                        onChange={(event) =>
                          setVehicle((current) => ({
                            ...current,
                            vehicleType: event.target.value,
                          }))
                        }
                      >
                        {[
                          "PICKUP",
                          "TATA_ACE",
                          "BOLERO_PICKUP",
                          "MINI_TRUCK",
                          "LIGHT_TRUCK",
                          "MEDIUM_TRUCK",
                          "HEAVY_TRUCK",
                          "CONTAINER",
                          "TRAILER",
                          "OTHER",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={vehicle.ownership}
                        onChange={(event) =>
                          setVehicle((current) => ({
                            ...current,
                            ownership: event.target.value,
                          }))
                        }
                      >
                        {["OWNED", "HIRED", "LEASED"].map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Current city"
                        value={vehicle.currentCity}
                        onChange={(event) =>
                          setVehicle((current) => ({
                            ...current,
                            currentCity: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        placeholder="Insurance policy number"
                        value={vehicle.insuranceNumber}
                        onChange={(event) =>
                          setVehicle((current) => ({
                            ...current,
                            insuranceNumber: event.target.value,
                          }))
                        }
                      />
                      <label className={styles.dateField}>
                        Insurance expiry
                        <input
                          required
                          type="date"
                          value={vehicle.insuranceExpiry}
                          onChange={(event) =>
                            setVehicle((current) => ({
                              ...current,
                              insuranceExpiry: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button disabled={loading}>Add vehicle</button>
                    </form>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void operate(
                          { action: "ADD_DOCUMENT", ...document },
                          "Compliance document added for review.",
                        );
                      }}
                    >
                      <h4>Add document</h4>
                      <select
                        value={document.documentType}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            documentType: event.target.value,
                          }))
                        }
                      >
                        {[
                          "PAN",
                          "GST",
                          "AADHAAR",
                          "DRIVING_LICENSE",
                          "VEHICLE_RC",
                          "VEHICLE_INSURANCE",
                          "GOODS_CARRIER_PERMIT",
                          "TRADE_LICENSE",
                          "COMPANY_REGISTRATION",
                          "BANK_CANCELLED_CHEQUE",
                          "OTHER",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Document number"
                        value={document.documentNumber}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            documentNumber: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        placeholder="File name"
                        value={document.fileName}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            fileName: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        type="url"
                        placeholder="Secure document URL (https://…)"
                        value={document.fileUrl}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            fileUrl: event.target.value,
                          }))
                        }
                      />
                      <label className={styles.dateField}>
                        Document expiry (when applicable)
                        <input
                          type="date"
                          value={document.expiryDate}
                          onChange={(event) =>
                            setDocument((current) => ({
                              ...current,
                              expiryDate: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={document.isMandatory}
                          onChange={(event) =>
                            setDocument((current) => ({
                              ...current,
                              isMandatory: event.target.checked,
                            }))
                          }
                        />{" "}
                        Mandatory for activation
                      </label>
                      <button disabled={loading}>Add document</button>
                    </form>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void operate(
                          { action: "ADD_BANK_ACCOUNT", ...bank },
                          "Bank account added for verification.",
                        );
                      }}
                    >
                      <h4>Add bank account</h4>
                      <input
                        required
                        placeholder="Account holder name"
                        value={bank.accountHolderName}
                        onChange={(event) =>
                          setBank((current) => ({
                            ...current,
                            accountHolderName: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        placeholder="Bank name"
                        value={bank.bankName}
                        onChange={(event) =>
                          setBank((current) => ({
                            ...current,
                            bankName: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        inputMode="numeric"
                        placeholder="Account number"
                        value={bank.accountNumber}
                        onChange={(event) =>
                          setBank((current) => ({
                            ...current,
                            accountNumber: event.target.value.replace(
                              /\D/g,
                              "",
                            ),
                          }))
                        }
                      />
                      <input
                        required
                        maxLength={11}
                        placeholder="IFSC code"
                        value={bank.ifscCode}
                        onChange={(event) =>
                          setBank((current) => ({
                            ...current,
                            ifscCode: event.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, ""),
                          }))
                        }
                      />
                      <select
                        value={bank.accountType}
                        onChange={(event) =>
                          setBank((current) => ({
                            ...current,
                            accountType: event.target.value,
                          }))
                        }
                      >
                        {["CURRENT", "SAVINGS", "CASH_CREDIT", "OVERDRAFT"].map(
                          (value) => (
                            <option key={value} value={value}>
                              {label(value)}
                            </option>
                          ),
                        )}
                      </select>
                      <button disabled={loading}>Add bank account</button>
                    </form>
                  </div>
                </section>
              )}
              {activePanel === "records" && (
                <section className={styles.records}>
                  <h3>Operational records</h3>
                  <h4>Vehicles</h4>
                  {selected.vendor.vehicles.length ? (
                    selected.vendor.vehicles.map((item) => (
                      <p key={item.id}>
                        <span>
                          <b>{item.registrationNumber}</b> ·{" "}
                          {label(item.vehicleType)} · {label(item.status)}
                        </span>
                        <span>
                          <em>{item.isActive ? "Operational" : "Inactive"}</em>
                          {editable && item.isActive && (
                            <button
                              className={styles.danger}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deactivate vehicle ${item.registrationNumber}?`,
                                  )
                                )
                                  void operate(
                                    {
                                      action: "DEACTIVATE_VEHICLE",
                                      vehicleId: item.id,
                                    },
                                    "Vehicle deactivated.",
                                  );
                              }}
                            >
                              Deactivate
                            </button>
                          )}
                        </span>
                      </p>
                    ))
                  ) : (
                    <p>No vehicles configured.</p>
                  )}
                  <h4>Compliance documents</h4>
                  {selected.vendor.documents.length ? (
                    selected.vendor.documents.map((item) => (
                      <p key={item.id}>
                        <span>
                          <b>{label(item.documentType)}</b> ·{" "}
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.fileName}
                          </a>{" "}
                          · {item.isMandatory ? "Mandatory" : "Optional"}
                        </span>
                        <span>
                          <em className={styles[item.verificationStatus]}>
                            {label(item.verificationStatus)}
                          </em>
                          {editable &&
                            item.verificationStatus !== "VERIFIED" && (
                              <button
                                onClick={() =>
                                  void operate(
                                    {
                                      action: "REVIEW_DOCUMENT",
                                      documentId: item.id,
                                      verificationStatus: "VERIFIED",
                                    },
                                    `${label(item.documentType)} verified.`,
                                  )
                                }
                              >
                                Verify
                              </button>
                            )}
                          {editable &&
                            item.verificationStatus === "PENDING" && (
                              <button
                                className={styles.danger}
                                onClick={() => {
                                  const reason = window.prompt(
                                    "Reason for rejecting this document?",
                                  );
                                  if (reason)
                                    void operate(
                                      {
                                        action: "REVIEW_DOCUMENT",
                                        documentId: item.id,
                                        verificationStatus: "REJECTED",
                                        rejectionReason: reason,
                                      },
                                      `${label(item.documentType)} rejected.`,
                                    );
                                }}
                              >
                                Reject
                              </button>
                            )}
                          {editable && item.isActive && (
                            <button
                              className={styles.danger}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${label(item.documentType)} from active records?`,
                                  )
                                )
                                  void operate(
                                    {
                                      action: "DEACTIVATE_DOCUMENT",
                                      documentId: item.id,
                                    },
                                    "Document removed from active records.",
                                  );
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </span>
                      </p>
                    ))
                  ) : (
                    <p>No documents configured.</p>
                  )}
                  <h4>Bank accounts</h4>
                  {selected.vendor.bankAccounts.length ? (
                    selected.vendor.bankAccounts.map((item) => (
                      <p key={item.id}>
                        <span>
                          <b>{item.bankName}</b> · {item.accountHolderName} ·{" "}
                          {item.ifscCode} · {label(item.accountType)}
                        </span>
                        <span>
                          <em
                            className={
                              item.verified ? styles.VERIFIED : styles.PENDING
                            }
                          >
                            {item.verified ? "Verified" : "Pending"}
                          </em>
                          {editable && !item.verified && (
                            <button
                              onClick={() =>
                                void operate(
                                  {
                                    action: "VERIFY_BANK_ACCOUNT",
                                    bankAccountId: item.id,
                                  },
                                  "Bank account verified and set as primary.",
                                )
                              }
                            >
                              Verify
                            </button>
                          )}
                          {editable && (
                            <button
                              className={styles.danger}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${item.bankName} account from active records?`,
                                  )
                                )
                                  void operate(
                                    {
                                      action: "DEACTIVATE_BANK_ACCOUNT",
                                      bankAccountId: item.id,
                                    },
                                    "Bank account removed from active records.",
                                  );
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </span>
                      </p>
                    ))
                  ) : (
                    <p>No bank accounts configured.</p>
                  )}
                </section>
              )}
              {selected.capabilities.canActivate && (
                <div className={styles.activation}>
                  <div>
                    <strong>
                      {selected.vendor.status === "ACTIVE"
                        ? "Vendor is active"
                        : selected.readiness.operationallyReady
                          ? "Ready for controlled activation"
                          : "Complete every blocker before activation"}
                    </strong>
                    <span>
                      Activation is serialized, revalidated on the server and
                      recorded in the CRM audit trail.
                    </span>
                  </div>
                  {selected.vendor.status === "ACTIVE" ? (
                    <button
                      className={styles.danger}
                      onClick={() =>
                        void operate(
                          { action: "SET_STATUS", activate: false },
                          "Vendor suspended.",
                        )
                      }
                    >
                      Suspend vendor
                    </button>
                  ) : (
                    <button
                      disabled={
                        !selected.readiness.operationallyReady || loading
                      }
                      onClick={() =>
                        void operate(
                          { action: "SET_STATUS", activate: true },
                          "Vendor activated successfully.",
                        )
                      }
                    >
                      Activate vendor
                    </button>
                  )}
                </div>
              )}
              {activePanel === "services" && (
                <section className={styles.matrix}>
                  <h3>Current service areas</h3>
                  {selected.vendor.serviceAreas.length ? (
                    selected.vendor.serviceAreas.map((area) => (
                      <p key={area.id}>
                        <b>{label(area.scope)}</b> —{" "}
                        {area.originCity || area.originState || "Pan India"}{" "}
                        <em>{area.active ? "Active" : "Inactive"}</em>
                      </p>
                    ))
                  ) : (
                    <p>No service areas configured.</p>
                  )}
                  <h3>Current service offerings</h3>
                  {selected.vendor.serviceOfferings.length ? (
                    selected.vendor.serviceOfferings.map((offering) => (
                      <p key={offering.id}>
                        <b>{label(offering.serviceType)}</b>{" "}
                        <em>{offering.active ? "Active" : "Inactive"}</em>
                      </p>
                    ))
                  ) : (
                    <p>No service offerings configured.</p>
                  )}
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
