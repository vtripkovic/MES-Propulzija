import { requirePageUser } from "@/app/lib/auth";
import WorkOrderDetailClient from "./work-order-detail-client";

export default async function WorkOrderDetailPage() {
  await requirePageUser();
  return <WorkOrderDetailClient />;
}
