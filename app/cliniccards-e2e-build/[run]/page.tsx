const TEST_VISIT_ID = "62407508";
const TEST_DATE = "2026-09-30";

function timePart(value: unknown) {
  const raw = String(value ?? "");
  const match = raw.match(/(?:^|\s)(\d{2}:\d{2})(?::\d{2})?/);
  return match?.[1] || raw.slice(0, 5);
}

async function cancelTestVisit() {
  const base = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
  const token = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
  if (!token) {
    console.log(`[cliniccards-e2e-cleanup] ${JSON.stringify({ ok: false, error: "missing_api_key" })}`);
    return;
  }

  const headers = { Accept: "application/json", Token: token };
  const listResponse = await fetch(`${base}/visits?from=${TEST_DATE}&to=${TEST_DATE}`, {
    headers,
    cache: "no-store",
  });
  const listPayload = await listResponse.json();
  const visits = Array.isArray(listPayload?.data) ? listPayload.data : [];
  const visit = visits.find((item: Record<string, unknown>) =>
    String(item?.visit_id ?? item?.id ?? "") === TEST_VISIT_ID,
  ) as Record<string, unknown> | undefined;

  if (!visit) {
    console.log(`[cliniccards-e2e-cleanup] ${JSON.stringify({ ok: true, visitId: TEST_VISIT_ID, status: "not_found" })}`);
    return;
  }

  if (String(visit.status || "").toUpperCase() === "CANCELLED") {
    console.log(`[cliniccards-e2e-cleanup] ${JSON.stringify({ ok: true, visitId: TEST_VISIT_ID, status: "already_cancelled" })}`);
    return;
  }

  const updatePayload = {
    visit_id: TEST_VISIT_ID,
    note: String(visit.note ?? ""),
    status: "CANCELLED",
    patient_id: String(visit.patient_id ?? ""),
    cabinet_id: String(visit.cabinet_id ?? ""),
    doctor_id: String(visit.doctor_id ?? ""),
    date: TEST_DATE,
    time_start: timePart(visit.visit_start ?? visit.time_start),
    time_end: timePart(visit.visit_end ?? visit.time_end),
  };

  const updateResponse = await fetch(`${base}/visits`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(updatePayload),
    cache: "no-store",
  });
  const updateResult = await updateResponse.json();

  const verifyResponse = await fetch(`${base}/visits?from=${TEST_DATE}&to=${TEST_DATE}`, {
    headers,
    cache: "no-store",
  });
  const verifyPayload = await verifyResponse.json();
  const verifyVisits = Array.isArray(verifyPayload?.data) ? verifyPayload.data : [];
  const verified = verifyVisits.find((item: Record<string, unknown>) =>
    String(item?.visit_id ?? item?.id ?? "") === TEST_VISIT_ID,
  ) as Record<string, unknown> | undefined;

  console.log(`[cliniccards-e2e-cleanup] ${JSON.stringify({
    ok: updateResponse.ok && String(updateResult?.result || "").toLowerCase() !== "fail",
    visitId: TEST_VISIT_ID,
    httpStatus: updateResponse.status,
    apiResult: updateResult?.result || null,
    apiError: updateResult?.error || null,
    verifiedStatus: verified?.status || null,
  })}`);
}

export async function generateStaticParams() {
  await cancelTestVisit();
  return [{ run: "cleanup" }];
}

export default function CliniccardsE2ECleanupPage() {
  return <main>Cliniccards E2E cleanup verification.</main>;
}
