import ProductPageClient from "./product-page-client";
import { requireAdminPage } from "@/app/lib/auth";

export default async function ProductPage() {
  await requireAdminPage();
  return <ProductPageClient />;
}