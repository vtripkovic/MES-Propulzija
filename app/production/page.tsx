import { requirePageUser } from "@/app/lib/auth";
import ProductionPageClient from "./production-page-client";

export default async function ProductionPage() {
  await requirePageUser();
  return <ProductionPageClient />;
}
