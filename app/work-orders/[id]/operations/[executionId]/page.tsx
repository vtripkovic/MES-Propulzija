import { requirePageUser } from "@/app/lib/auth";
import OperationDetailClient from "./operation-detail-client";

export default async function OperationDetailPage() {
  await requirePageUser();
  return <OperationDetailClient />;
}
