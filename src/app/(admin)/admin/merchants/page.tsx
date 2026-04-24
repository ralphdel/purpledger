"use client";

import { useEffect, useState } from "react";
import { Users, Search, ShieldCheck, DollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/calculations";
import type { Merchant } from "@/lib/types";

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const sb = createClient();
    sb.from("merchants")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMerchants((data || []) as Merchant[]);
        setLoading(false);
      });
  }, []);

  const filtered = merchants.filter(
    (m) =>
      m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      case "suspended": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case "corporate": return "bg-purple-50 text-purple-700 border-purple-200";
      case "individual": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">All Merchants</h1>
        <Card className="border shadow-none animate-pulse">
          <CardContent className="p-6"><div className="h-48 bg-neutral-100 rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">All Merchants</h1>
        <p className="text-neutral-500 text-sm mt-1">{merchants.length} registered merchants</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          placeholder="Search merchants..."
          className="pl-10 border-2 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 border-b hover:bg-neutral-50">
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Business</TableHead>
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Contact</TableHead>
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Tier</TableHead>
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Verification</TableHead>
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Collection Limit</TableHead>
                <TableHead className="font-bold text-neutral-900 text-xs uppercase">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className="border-b hover:bg-neutral-50">
                  <TableCell>
                    <p className="font-medium text-sm">{m.business_name}</p>
                    <p className="text-xs text-neutral-500">ID: {m.id.slice(0, 8)}...</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{m.email}</p>
                    <p className="text-xs text-neutral-500">{m.phone || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize border-2 ${tierColor(m.merchant_tier)}`}>
                      {m.merchant_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize border-2 ${statusColor(m.verification_status)}`}>
                      {m.verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {Number(m.monthly_collection_limit) > 0
                      ? formatNaira(Number(m.monthly_collection_limit))
                      : "Unlimited"}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {new Date(m.created_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500 text-sm">
                    No merchants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
