import { requirePageUser } from "@/app/lib/auth";
import ProductsPageClient from "./products-page-client";

export default async function ProductsPage() {
  await requirePageUser();
  return <ProductsPageClient />;
}
