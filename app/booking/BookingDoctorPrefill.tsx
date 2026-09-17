"use client";

import { useEffect } from "react";

function normalize(value: string) {
  return value.toLocaleLowerCase("uk-UA").replace(/\s+/g, " ").trim();
}

export default function BookingDoctorPrefill() {
  useEffect(() => {
    const doctor = new URLSearchParams(window.location.search).get("doctor")?.trim();
    if (!doctor) return;

    const target = normalize(doctor);
    let modeClicked = false;
    let finished = false;

    const tryPrefill = () => {
      if (finished) return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

      const doctorButton = buttons.find((button) => normalize(button.textContent || "").includes(target));
      if (doctorButton) {
        finished = true;
        doctorButton.click();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "booking_doctor_prefilled", doctor_name: doctor });
        return;
      }

      if (!modeClicked) {
        const modeButton = buttons.find((button) =>
          normalize(button.textContent || "").includes("хочу до конкретного лікаря"),
        );
        if (modeButton) {
          modeClicked = true;
          modeButton.click();
        }
      }
    };

    tryPrefill();
    const observer = new MutationObserver(tryPrefill);
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 12000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
