import { requireAdminPage } from "@/app/lib/auth";
import RoutingPageClient from "./routing-page-client";

export default async function ProductRoutingPage() {
  await requireAdminPage();
  return <RoutingPageClient />;
}
