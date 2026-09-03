type JsonRecord = Record<string, unknown>;

type CliniccardsMember = {
  id?: string | number;
  name?: string;
  state?: boolean;
};

type CliniccardsPriceItem = {
  id?: string | number;
  name?: string;
  alias?: string;
  items?: Record<string, number | string>;
};

type FilterData = {
  members?: CliniccardsMember[];
  priceItems?: CliniccardsPriceItem[];
};

export type CliniccardsBookingDoctorOption = {
  id: string;
  name: string;
  serviceCount: number;
};

export type CliniccardsBookingServiceOption = {
  id: string;
  name: string;
  doctorIds: string[];
};

export type CliniccardsBookingOptions = {
  doctors: CliniccardsBookingDoctorOption[];
  services: CliniccardsBookingServiceOption[];
};

const DEFAULT_API_BASE = "https://cliniccards.com/api";

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cleanText(value: unknown) {
  return clean(value)
    .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function serviceNameKey(value: string) {
  return value
    .toLocaleLowerCase("uk-UA")
    .replace(/[’ʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function servicePriority(name: string) {
  const value = serviceNameKey(name);
  if (value === "консультація дерматолога") return 0;
  if (value.includes("консультація косметолога")) return 1;
  if (value.includes("консультація трихолога")) return 2;
  if (value === "консультація нутриціолога") return 3;
  if (value === "комбінована чистка обличчя") return 10;
  if (value.includes("ботулінотерапія верхня третина комплекс")) return 11;
  if (value.includes("корекція губ")) return 12;
  if (value.includes("біоревіталізація")) return 13;
  if (value === "ipl терапія обличчя") return 14;
  if (value.includes("мікроголковий rf обличчя")) return 15;
  return 100;
}

function apiBase() {
  return (process.env.CLINIC_BOOKING_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
}

function apiKey() {
  return (process.env.CLINIC_BOOKING_API_KEY || "").trim();
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 500) };
  }
}

async function cliniccardsRequest(path: string) {
  const token = apiKey();
  if (!token) throw new Error("Cliniccards API key is not configured");

  const response = await fetch(`${apiBase()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Token: token,
    },
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(cleanText(record?.message) || `Cliniccards API ${response.status}`);
  }
  return payload;
}

function bookingSettings(payload: unknown) {
  const root = asRecord(payload);
  return asRecord(root?.data) || root;
}

function bookingTokenFromLink(link: string) {
  try {
    const url = new URL(link);
    return {
      origin: url.origin,
      token: url.pathname.split("/").filter(Boolean).at(-1) || "",
    };
  } catch {
    return { origin: "", token: "" };
  }
}

async function publicFilterData(settingsPayload: unknown): Promise<FilterData> {
  const link = clean(bookingSettings(settingsPayload)?.booking_link);
  const { origin, token } = bookingTokenFromLink(link);
  if (!origin || !token) throw new Error("Cliniccards booking link is unavailable");

  const response = await fetch(`${origin}/booking/filter-data/${encodeURIComponent(token)}?sid=0`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ doctor: {}, service: {}, time: null }),
  });
  const payload = await parseResponse(response);
  if (!response.ok) throw new Error(`Cliniccards booking options ${response.status}`);
  const record = asRecord(payload);
  if (!record) throw new Error("Cliniccards returned invalid booking options");
  return record as FilterData;
}

function positiveDoctorIds(items: CliniccardsPriceItem["items"]) {
  if (!items || typeof items !== "object") return [];
  return Object.entries(items)
    .filter(([, value]) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric > 0;
    })
    .map(([doctorId]) => doctorId);
}

export async function getCliniccardsBookingOptions(): Promise<CliniccardsBookingOptions> {
  const settings = await cliniccardsRequest("/booking-settings");
  const data = await publicFilterData(settings);

  const rawServices = (Array.isArray(data.priceItems) ? data.priceItems : [])
    .map((item, index) => {
      const name = cleanText(item.alias) || cleanText(item.name);
      const id = clean(item.id) || `service-${index}`;
      return { id, name, doctorIds: positiveDoctorIds(item.items) };
    })
    .filter((item) => item.name && item.doctorIds.length > 0);

  // Cliniccards can contain duplicated price rows with the same patient-facing title.
  // Keep the first canonical row so the visible list and slot resolver use the same source item.
  const serviceGroups = new Map<string, CliniccardsBookingServiceOption>();
  for (const service of rawServices) {
    const key = serviceNameKey(service.name);
    if (!serviceGroups.has(key)) {
      serviceGroups.set(key, {
        id: service.id,
        name: service.name,
        doctorIds: [...new Set(service.doctorIds)],
      });
    }
  }

  const services = [...serviceGroups.values()]
    .sort((a, b) => {
      const rank = servicePriority(a.name) - servicePriority(b.name);
      return rank || a.name.localeCompare(b.name, "uk-UA");
    });

  const serviceCountByDoctor = new Map<string, number>();
  services.forEach((service) => {
    service.doctorIds.forEach((doctorId) => {
      serviceCountByDoctor.set(doctorId, (serviceCountByDoctor.get(doctorId) || 0) + 1);
    });
  });

  const doctors = (Array.isArray(data.members) ? data.members : [])
    .filter((member) => member?.state !== false)
    .map((member) => {
      const id = clean(member.id);
      return {
        id,
        name: cleanText(member.name),
        serviceCount: serviceCountByDoctor.get(id) || 0,
      };
    })
    .filter((doctor) => doctor.id && doctor.name && doctor.serviceCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "uk-UA"));

  return { doctors, services };
}
