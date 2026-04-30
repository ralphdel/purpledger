"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Upload, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkCreateInvoicesAction } from "@/lib/actions";
import { getMerchant, getClients, getItemCatalog, getDiscountTemplates } from "@/lib/data";
import { calculateInvoiceTotals, formatNaira } from "@/lib/calculations";
import type { Client, ItemCatalog, DiscountTemplate } from "@/lib/types";
import Papa from "papaparse";

export default function BulkInvoicesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]); // Grouped invoices
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Data for mapping
  const [merchantId, setMerchantId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<ItemCatalog[]>([]);
  const [discounts, setDiscounts] = useState<DiscountTemplate[]>([]);

  useEffect(() => {
    Promise.all([getMerchant(), getClients(), getItemCatalog(), getDiscountTemplates()]).then(
      ([m, c, cat, d]) => {
        if (m) setMerchantId(m.id);
        setClients(c);
        setCatalog(cat);
        setDiscounts(d);
      }
    );
  }, []);

  const downloadTemplate = () => {
    const headers = [
      "Bulk Reference",
      "Client Email",
      "Invoice Type (collection/record)",
      "Discount Template Name",
      "Tax Percentage",
      "Item Name",
      "Quantity",
      "Unit Rate (Leave blank if using Catalog Item)",
      "Notes"
    ];
    const example1 = ["INV-001", "john@example.com", "collection", "", "7.5", "Web Design", "1", "150000", "Monthly fee"];
    const example2 = ["INV-001", "john@example.com", "collection", "", "7.5", "Hosting", "1", "20000", ""];
    const example3 = ["INV-002", "jane@example.com", "record", "New Year Promo", "0", "Consultation", "2", "50000", ""];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + example1.join(",") + "\n"
      + example2.join(",") + "\n"
      + example3.join(",");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purpledger_bulk_invoices_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError("");

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error parsing CSV. Please ensure it matches the template.");
          return;
        }

        // Group rows by Bulk Reference
        const groups: Record<string, any[]> = {};
        results.data.forEach((row: any) => {
          const ref = row["Bulk Reference"];
          if (!ref) return;
          if (!groups[ref]) groups[ref] = [];
          groups[ref].push(row);
        });

        const formattedInvoices = Object.keys(groups).map((ref, index) => {
          const rows = groups[ref];
          const firstRow = rows[0];

          // Map Client
          const clientEmail = String(firstRow["Client Email"]).trim().toLowerCase();
          const matchedClient = clients.find(c => c.email?.toLowerCase() === clientEmail);

          // Map Discount
          const discountName = String(firstRow["Discount Template Name"] || "").trim().toLowerCase();
          const matchedDiscount = discounts.find(d => d.name.toLowerCase() === discountName);
          const defaultDiscountPct = matchedDiscount ? matchedDiscount.percentage : 0;

          const taxPct = parseFloat(firstRow["Tax Percentage"]) || 0;
          const invoiceType = String(firstRow["Invoice Type (collection/record)"]).toLowerCase().includes("record") ? "record" : "collection";
          
          const lineItems = rows.map((r: any) => {
            const itemName = String(r["Item Name"]).trim();
            let unitRate = parseFloat(r["Unit Rate (Leave blank if using Catalog Item)"]);
            
            // If unit rate is blank, try to map to catalog
            if (isNaN(unitRate)) {
              const matchedCatalog = catalog.find(c => c.item_name.toLowerCase() === itemName.toLowerCase());
              unitRate = matchedCatalog ? matchedCatalog.default_rate : 0;
            }

            const qty = parseFloat(r["Quantity"]) || 1;
            return {
              item_name: itemName,
              quantity: qty,
              unit_rate: unitRate,
              line_total: qty * unitRate
            };
          });

          // Calculate totals
          const parsedItems = lineItems.map(li => ({ quantity: li.quantity, unitRate: li.unit_rate }));
          const totals = calculateInvoiceTotals(parsedItems, defaultDiscountPct, taxPct);

          return {
            bulk_ref: ref,
            client_id: matchedClient?.id || "",
            client_email_raw: clientEmail,
            invoice_type: invoiceType,
            discount_pct: defaultDiscountPct,
            tax_pct: taxPct,
            discount_value: totals.discountValue,
            tax_value: totals.taxValue,
            subtotal: totals.subtotal,
            grand_total: totals.grandTotal,
            notes: firstRow["Notes"] || "",
            pay_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
            lineItems
          };
        });

        setParsedData(formattedInvoices);
      },
      error: (err) => {
        setError("Failed to read the file. Please try again.");
      }
    });
  };

  const updateInvoiceClient = (index: number, clientId: string) => {
    const newData = [...parsedData];
    newData[index].client_id = clientId;
    setParsedData(newData);
  };

  const handleSubmit = async () => {
    // Validate that all invoices have a client_id mapped
    const unmapped = parsedData.filter(inv => !inv.client_id);
    if (unmapped.length > 0) {
      setError(`Please select a valid client for all invoices. ${unmapped.length} invoices are unmapped.`);
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const result = await bulkCreateInvoicesAction(merchantId, parsedData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/invoices");
        }, 2000);
      } else {
        setError((result as any).error || "Failed to create bulk invoices.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-purp-900">Successfully Imported!</h2>
        <p className="text-neutral-500">{parsedData.length} invoices have been created. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="outline" size="icon" className="border-2 border-purp-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Bulk Invoice Import</h1>
          <p className="text-neutral-500 text-sm mt-1">Group line items by "Bulk Reference" to create multiple invoices.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Instructions */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-2 border-purp-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-bold text-purp-900">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-600">
              <p>1. Download the provided CSV template.</p>
              <p>2. Use the same <strong>Bulk Reference</strong> for multiple rows if they belong to the same invoice.</p>
              <p>3. If a <strong>Client Email</strong> isn't found, you can manually map it in the preview table.</p>
              <Button onClick={downloadTemplate} className="w-full bg-purp-100 hover:bg-purp-200 text-purp-900 font-semibold border-2 border-purp-200 shadow-none mt-2">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purp-200 shadow-none">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-purp-50 rounded-full flex items-center justify-center border-2 border-purp-200 border-dashed">
                <Upload className="h-5 w-5 text-purp-700" />
              </div>
              <div>
                <p className="font-semibold text-purp-900">Upload CSV</p>
              </div>
              <div className="relative w-full">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button className="w-full pointer-events-none bg-purp-900 text-white font-semibold">
                  Select File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="md:col-span-3">
          <Card className="border-2 border-purp-200 shadow-none h-full flex flex-col">
            <CardHeader className="pb-3 border-b-2 border-purp-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-purp-900">Invoice Data Mapping</CardTitle>
                {parsedData.length > 0 && (
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200">
                    {parsedData.length} invoice(s)
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {error && (
                <div className="m-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {parsedData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
                  <FileText className="h-10 w-10 mb-3 opacity-20" />
                  <p>Upload a file to see preview here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-purp-50">
                      <TableRow>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Ref</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap min-w-[200px]">Mapped Client</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Items</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((inv, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-xs">{inv.bulk_ref}</TableCell>
                          <TableCell>
                            {!inv.client_id ? (
                              <Select onValueChange={(val) => val && updateInvoiceClient(idx, val as string)}>
                                <SelectTrigger className="h-8 text-xs border-red-300 bg-red-50 text-red-700">
                                  <SelectValue placeholder={`Map: ${inv.client_email_raw}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.email})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">{clients.find(c => c.id === inv.client_id)?.full_name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {inv.lineItems.length} item(s)
                          </TableCell>
                          <TableCell className="font-semibold text-purp-900">
                            {formatNaira(inv.grand_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="p-4 border-t-2 border-purp-100 bg-white mt-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="w-full bg-purp-900 hover:bg-purp-700 text-white font-semibold h-11"
                  >
                    {isUploading ? "Generating Invoices..." : `Create ${parsedData.length} Invoices`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
