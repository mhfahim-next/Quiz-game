import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: { default: "অ্যাডমিন", template: "%s · অ্যাডমিন" }, robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড" },
  { href: "/admin/categories", label: "বিভাগ" },
  { href: "/admin/levels", label: "লেভেল" },
  { href: "/admin/questions", label: "প্রশ্ন" },
  { href: "/admin/import", label: "CSV ইমপোর্ট" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // middleware already checked; re-check close to the data
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="অ্যাডমিন মেনু" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-800 shadow-sm ring-1 ring-black/5 hover:bg-violet-50"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
