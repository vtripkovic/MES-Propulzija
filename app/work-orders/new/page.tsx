import { requireAdminPage } from "@/app/lib/auth";
import NewWorkOrderClient from "./new-work-order-client";

export default async function NewWorkOrderPage() {
  await requireAdminPage();
  return <NewWorkOrderClient />;
}
