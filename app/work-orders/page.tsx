import { Suspense } from "react";
import WorkOrdersPageClient from "./work-orders-page-client";

export default function WorkOrdersPage() {
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