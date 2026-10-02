import { Suspense } from "react";
import WorkOrdersPageClient from "./work-orders-page-client";
import { requirePageUser } from "@/app/lib/auth";

export default async function WorkOrdersPage() {
  await requirePageUser();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          Učitavanje...
        </div>
      }
    >
      <WorkOrdersPageClient />
    </Suspense>
  );
}