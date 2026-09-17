import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DoctorProfilePage from "../../../components/DoctorProfilePage";
import { doctorMetadata, getDoctor } from "../../../lib/doctors";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  if (!doctor) return { title: "Лікар не знайдений | RESET Clinic" };

  const metadata = doctorMetadata(doctor);
  return {
    ...metadata,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doctor = getDoctor(slug);
  if (!doctor) notFound();
  return <DoctorProfilePage doctor={doctor} />;
}
