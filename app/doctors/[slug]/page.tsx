import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DoctorProfilePage from "../../../components/DoctorProfilePage";
import { doctorMetadata, getDoctor } from "../../../lib/doctors";
import "./doctor-profile-logo.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  return doctor ? doctorMetadata(doctor) : { title: "Лікар не знайдений | RESET Clinic", robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  if (!doctor) notFound();
  return <DoctorProfilePage doctor={doctor} />;
}
