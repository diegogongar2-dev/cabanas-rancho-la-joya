import { ReservationStatusExperience } from "../../site-client";

export function generateStaticParams() {
  return [{ token: "demo-rancho-la-joya" }];
}

export default function ReservationStatusPage() {
  return <ReservationStatusExperience />;
}
