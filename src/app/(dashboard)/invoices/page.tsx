"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
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
import { getInvoices, getMerchant } from "@/lib/data";
import { formatNaira, getStatusColor, getStatusLabel } from "@/lib/calculations";
import type { InvoiceWithClient, Merchant } from "@/lib/types";

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"record" | "collection">("record");
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    // Restore tab from localStorage if available
    const savedTab = localStorage.getItem("purpledger_invoice_tab");
    if (savedTab === "collection") {
      setActiveTab("collection");
    }

    const sb = createClient();
    Promise.all([
      getInvoices(),
      getMerchant()
    ]).then(([invoiceData, merchantResult]) => {
      setInvoices(invoiceData);
      if (merchantResult) setMerchant(merchantResult);
      
      // If Starter tier or unverified, force back to Record tab
      if (merchantResult?.subscription_plan === "starter" || merchantResult?.verification_status !== "verified") {
        setActiveTab("record");
      }
      
      setLoading(false);
    });
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as "record" | "collection";
    if ((merchant?.subscription_plan === "starter" || merchant?.verification_status !== "verified") && tab === "collection") return;
    setActiveTab(tab);
    localStorage.setItem("purpledger_invoice_tab", tab);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesTab = inv.invoice_type === activeTab || (!inv.invoice_type && activeTab === "collection");
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clients?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
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
        <div className="flex items-center gap-2">
          <Link href="/invoices/bulk">
            <Button variant="outline" className="border-2 border-purp-200 text-purp-700 font-semibold bg-white hover:bg-purp-50">
              Bulk Upload
            </Button>
          </Link>
          <Link href="/invoices/create">
            <Button className="bg-purp-900 hover:bg-purp-700 text-white font-semibold">
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
        <TabsList className="bg-purp-50 border-2 border-purp-200 h-12 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="record" className="data-[state=active]:bg-white data-[state=active]:text-purp-900 font-semibold data-[state=active]:shadow-sm">
            Record Invoices
          </TabsTrigger>
          <TabsTrigger 
            value="collection" 
            className="data-[state=active]:bg-white data-[state=active]:text-purp-900 font-semibold data-[state=active]:shadow-sm relative"
            disabled={merchant?.subscription_plan === "starter" || merchant?.verification_status !== "verified"}
          >
            Collection Invoices
            {merchant?.subscription_plan === "starter" ? (
              <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center">
                🔒 PRO
              </span>
            ) : merchant?.verification_status !== "verified" ? (
              <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center">
                🔒 KYC
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-0">
          {/* Record Invoice Table */}
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
                    <TableHead className="font-bold text-purp-900 text-xs uppercase">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="border-b border-purp-200 hover:bg-purp-50 cursor-pointer">
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="font-mono font-semibold text-purp-700 hover:text-purp-900 text-sm">
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
                        <Badge variant="outline" className={`${getStatusColor(inv.status)} border-2 font-semibold text-xs`}>
                          {getStatusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatNaira(Number(inv.grand_total))}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-600 font-medium">{formatNaira(Number(inv.amount_paid))}</TableCell>
                      <TableCell className="text-right text-sm text-amber-600 font-medium">{formatNaira(Number(inv.outstanding_balance))}</TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {inv.pay_by_date ? new Date(inv.pay_by_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                        No record invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="mt-0">
          {/* Collection Invoice Table */}
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
                    <TableHead className="font-bold text-purp-900 text-xs uppercase">Pay-By Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="border-b border-purp-200 hover:bg-purp-50 cursor-pointer">
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="font-mono font-semibold text-purp-700 hover:text-purp-900 text-sm">
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
                        <Badge variant="outline" className={`${getStatusColor(inv.status)} border-2 font-semibold text-xs`}>
                          {getStatusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatNaira(Number(inv.grand_total))}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-600 font-medium">{formatNaira(Number(inv.amount_paid))}</TableCell>
                      <TableCell className="text-right text-sm text-amber-600 font-medium">{formatNaira(Number(inv.outstanding_balance))}</TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {inv.pay_by_date ? new Date(inv.pay_by_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                        No collection invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
