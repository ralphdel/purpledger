"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoices } from "@/lib/data";
import { formatNaira, getStatusColor, getStatusLabel } from "@/lib/calculations";
import type { InvoiceWithClient } from "@/lib/types";

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoices().then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clients?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-purp-900">Invoices</h1></div>
        <Card className="border-2 border-purp-200 shadow-none animate-pulse">
          <CardContent className="p-6"><div className="h-64 bg-purp-50 rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Invoices</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {invoices.length} total invoices · {invoices.filter(i => i.status === "open" || i.status === "partially_paid").length} active
          </p>
        </div>
        <Link href="/invoices/create">
          <Button className="bg-purp-900 hover:bg-purp-700 text-white font-semibold">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search invoices..."
            className="pl-10 border-2 border-purp-200 bg-white focus:border-purp-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48 border-2 border-purp-200 bg-purp-50">
            <Filter className="mr-2 h-4 w-4 text-neutral-500" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="border-2 border-purp-200">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="manually_closed">Manually Closed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card className="border-2 border-purp-200 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-purp-50 border-b-2 border-purp-200 hover:bg-purp-50">
                <TableHead className="font-bold text-purp-900 text-xs uppercase">Invoice #</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase">Client</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase">Status</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase text-right">Grand Total</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase text-right">Paid</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase text-right">Outstanding</TableHead>
                <TableHead className="font-bold text-purp-900 text-xs uppercase">Pay-By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-b border-purp-200 hover:bg-purp-50 cursor-pointer"
                >
                  <TableCell>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono font-semibold text-purp-700 hover:text-purp-900 text-sm"
                    >
                      {inv.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium">{inv.clients?.full_name || "Unknown"}</p>
                      <p className="text-xs text-neutral-500">{inv.clients?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(inv.status)} border-2 font-semibold text-xs`}
                    >
                      {getStatusLabel(inv.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {formatNaira(Number(inv.grand_total))}
                  </TableCell>
                  <TableCell className="text-right text-sm text-emerald-600 font-medium">
                    {formatNaira(Number(inv.amount_paid))}
                  </TableCell>
                  <TableCell className="text-right text-sm text-amber-600 font-medium">
                    {formatNaira(Number(inv.outstanding_balance))}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {inv.pay_by_date
                      ? new Date(inv.pay_by_date).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                    No invoices found.
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
