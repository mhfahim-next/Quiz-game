"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importQuestions, type ImportResult } from "@/lib/admin/actions";
import { CSV_COLUMNS, MAX_CSV_ROWS } from "@/lib/admin/schemas";

type Row = Record<string, string>;

export function CsvImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setParseError(null);
    setRows([]);
    if (!file) return;
    setFileName(file.name);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: "greedy",
      encoding: "UTF-8",
      transformHeader: (h) => h.replace(/^﻿/, "").trim().toLowerCase(),
      complete: (res) => {
        const missing = CSV_COLUMNS.filter((c) => c !== "explanation" && c !== "image_url" && !res.meta.fields?.includes(c));
        if (missing.length) return setParseError(`এই কলামগুলো নেই: ${missing.join(", ")}`);
        if (res.data.length === 0) return setParseError("ফাইলে কোনো সারি নেই।");
        if (res.data.length > MAX_CSV_ROWS) return setParseError(`একবারে সর্বোচ্চ ${MAX_CSV_ROWS}টি সারি দেওয়া যায়।`);
        setRows(res.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  function submit() {
    start(async () => {
      const res = await importQuestions(rows);
      setResult(res);
      if (res.ok) {
        toast.success(`${res.inserted}টি প্রশ্ন ইমপোর্ট হয়েছে ✅`);
        setRows([]);
        setFileName("");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-xl bg-white p-4 text-sm leading-relaxed ring-1 ring-black/5">
        <p className="font-bold">CSV ফরম্যাট (UTF-8, প্রথম সারিতে কলামের নাম):</p>
        <code className="mt-1 block break-words rounded bg-slate-100 p-2">{CSV_COLUMNS.join(",")}</code>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <b>category_slug</b> — বিভাগের slug (যেমন <code>animals</code>); <b>level</b> — লেভেল নম্বর (১, ২, ৩…) — লেভেলটি আগে থেকে থাকতে হবে।
          </li>
          <li>
            <b>correct</b> — সঠিক উত্তরের নম্বর, ১ থেকে ৪। <b>explanation</b> ও <b>image_url</b> ঐচ্ছিক।
          </li>
          <li>একটি সারিতেও ভুল থাকলে কোনো প্রশ্নই ইমপোর্ট হয় না (সব-অথবা-কিছুই-না)।</li>
        </ul>
        <a href="/templates/questions-template.csv" download className="mt-3 inline-flex items-center gap-1 font-bold text-violet-700 underline">
          <Download className="size-4" /> নমুনা CSV ডাউনলোড
        </a>
      </div>

      <div className="grid gap-2">
        <label htmlFor="csv" className="text-sm font-medium">
          CSV ফাইল বেছে নাও
        </label>
        <Input id="csv" type="file" accept=".csv,text/csv" onChange={onFile} />
        {parseError && (
          <p role="alert" className="font-semibold text-red-600">
            {parseError}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="grid gap-3">
          <p className="font-bold">
            {fileName}: {rows.length}টি প্রশ্ন পাওয়া গেছে (প্রথম ৫টি নিচে দেখানো হলো)
          </p>
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>বিভাগ</TableHead>
                  <TableHead>লেভেল</TableHead>
                  <TableHead>প্রশ্ন</TableHead>
                  <TableHead>সঠিক</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 5).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.category_slug}</TableCell>
                    <TableCell>{r.level}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.text}</TableCell>
                    <TableCell>{r.correct}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={submit} disabled={pending} className="h-11 w-full sm:w-auto">
            <Upload /> {pending ? "ইমপোর্ট হচ্ছে…" : `${rows.length}টি প্রশ্ন ইমপোর্ট করো`}
          </Button>
        </div>
      )}

      {result && !result.ok && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
          <p className="font-bold text-red-800">{result.error}</p>
          {result.rowErrors && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
              {result.rowErrors.map((e) => (
                <li key={`${e.row}-${e.message}`}>
                  সারি {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {result?.ok && <p className="font-bold text-green-700">✅ {result.inserted}টি প্রশ্ন যোগ হয়েছে।</p>}
    </div>
  );
}
