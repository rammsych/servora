"use client";

import AdminShell from "@/components/AdminShell";
import NewGuidePage from "@/app/guides/new/page";

export default function AdminNewGuidePage() {
  return (
    <AdminShell>
      <NewGuidePage adminMode />
    </AdminShell>
  );
}