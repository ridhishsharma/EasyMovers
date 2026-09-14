import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "EasyMovers | Move Anywhere With Confidence",
  description: "Plan your home move, office relocation or vehicle transport with EasyMovers. Share your requirements and request a tailored moving quotation.",
};

export default function HomePage() {
  return <LandingPage />;
}
