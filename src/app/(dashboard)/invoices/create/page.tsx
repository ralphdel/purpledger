"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getClients } from "@/lib/data";
import type { Client } from "@/lib/types";
import { calculateInvoiceTotals, formatNaira } from "@/lib/calculations";

interface FormLineItem {
  id: string;
  itemName: string;
  quantity: string;
  unitRate: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [useCustomNumber, setUseCustomNumber] = useState(false);
  const [clientId, setClientId] = useState("");
  const [discountPct, setDiscountPct] = useState("0");
  const [taxPct, setTaxPct] = useState("7.5");
  const [feeAbsorption, setFeeAbsorption] = useState("business");
  const [payByDate, setPayByDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { id: "1", itemName: "", quantity: "1", unitRate: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), itemName: "", quantity: "1", unitRate: "" },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((li) => li.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof FormLineItem, value: string) => {
    setLineItems(
      lineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  const parsedItems = lineItems.map((li) => ({
    quantity: parseFloat(li.quantity) || 0,
    unitRate: parseFloat(li.unitRate) || 0,
  }));

  const totals = calculateInvoiceTotals(
    parsedItems,
    parseFloat(discountPct) || 0,
    parseFloat(taxPct) || 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      router.push("/invoices");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="outline" size="icon" className="border-2 border-purp-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Create Invoice</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Fill in the details to generate a new invoice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Invoice Number */}
        <Card className="border-2 border-purp-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-purp-900">
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Client</Label>
                <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                  <SelectTrigger className="border-2 border-purp-200 bg-purp-50 h-11">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-purp-200">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}{" "}
                        {client.company_name && `— ${client.company_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <button
                    type="button"
                    onClick={() => setUseCustomNumber(!useCustomNumber)}
                    className="text-xs text-purp-700 hover:underline font-medium"
                  >
                    {useCustomNumber ? "Use auto-generated" : "Use custom"}
                  </button>
                </div>
                <Input
                  value={useCustomNumber ? invoiceNumber : "INV-2025-007 (auto)"}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  disabled={!useCustomNumber}
                  className="border-2 border-purp-200 bg-purp-50 h-11"
                  placeholder="e.g. INV-2025-007"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pay-By Date</Label>
                <Input
                  type="date"
                  value={payByDate}
                  onChange={(e) => setPayByDate(e.target.value)}
                  className="border-2 border-purp-200 bg-purp-50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fee Absorption</Label>
                <Select value={feeAbsorption} onValueChange={(v) => setFeeAbsorption(v ?? "business")}>
                  <SelectTrigger className="border-2 border-purp-200 bg-purp-50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-purp-200">
                    <SelectItem value="business">Business Absorbs</SelectItem>
                    <SelectItem value="customer">Customer Absorbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="border-2 border-purp-200 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-purp-900">
                Line Items
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="border-2 border-purp-200 text-purp-700 hover:bg-purp-100"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header Row */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-bold text-purp-900 uppercase tracking-wider px-1">
                <div className="col-span-5">Item Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-3">Unit Rate (₦)</div>
                <div className="col-span-2 text-right">Line Total</div>
              </div>

              {lineItems.map((item) => {
                const lineTotal =
                  (parseFloat(item.quantity) || 0) *
                  (parseFloat(item.unitRate) || 0);
                return (
                  <div
                    key={item.id}
                    className="grid sm:grid-cols-12 gap-3 items-center bg-purp-50 border border-purp-200 rounded-lg p-3"
                  >
                    <div className="sm:col-span-5">
                      <Input
                        placeholder="e.g. Business Strategy Consultation"
                        value={item.itemName}
                        onChange={(e) =>
                          updateLineItem(item.id, "itemName", e.target.value)
                        }
                        className="border-2 border-purp-200 bg-white h-10"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, "quantity", e.target.value)
                        }
                        className="border-2 border-purp-200 bg-white h-10"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.unitRate}
                        onChange={(e) =>
                          updateLineItem(item.id, "unitRate", e.target.value)
                        }
                        className="border-2 border-purp-200 bg-white h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                      <span className="font-semibold text-sm text-purp-900">
                        {formatNaira(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tax, Discount, Notes + Totals Summary */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-2 border-purp-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-purp-900">
                Tax, Discount & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Discount (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="border-2 border-purp-200 bg-purp-50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tax (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxPct}
                    onChange={(e) => setTaxPct(e.target.value)}
                    className="border-2 border-purp-200 bg-purp-50 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes / Terms</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, additional context..."
                  className="border-2 border-purp-200 bg-purp-50 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals Summary */}
          <Card className="border-2 border-purp-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-purp-900">
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-medium">{formatNaira(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">
                    Discount ({discountPct || "0"}%)
                  </span>
                  <span className="font-medium text-red-500">
                    -{formatNaira(totals.discountValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Tax ({taxPct || "0"}%)</span>
                  <span className="font-medium">
                    +{formatNaira(totals.taxValue)}
                  </span>
                </div>
                <Separator className="bg-purp-200" />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-purp-900">
                    Grand Total
                  </span>
                  <span className="text-2xl font-bold text-purp-900">
                    {formatNaira(totals.grandTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 bg-purp-900 hover:bg-purp-700 text-white font-semibold"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Invoice...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Create Invoice & Generate Link
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
