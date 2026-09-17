import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DoctorProfilePage from "../../../components/DoctorProfilePage";
import { DOCTORS, getDoctor } from "../../../lib/doctors";
import { doctorEeatMetadata } from "../../../lib/doctor-eeat";

export const revalidate = 21600;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DOCTORS.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  if (!doctor) return { title: "RESET Clinic" };
  return doctorEeatMetadata(doctor);
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  if (!doctor) notFound();
  return <DoctorProfilePage doctor={doctor} />;
}
