import type { Metadata } from "next";
import { CsvImport } from "@/components/admin/csv-import";

export const metadata: Metadata = { title: "CSV ইমপোর্ট" };

export default function ImportPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">CSV থেকে প্রশ্ন ইমপোর্ট</h1>
      <CsvImport />
    </div>
  );
}
