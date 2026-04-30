"use client";

import { useState } from "react";
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
import { bulkCreateClientsAction } from "@/lib/actions";
import { getMerchant } from "@/lib/data";
import Papa from "papaparse";

export default function BulkClientsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const downloadTemplate = () => {
    const headers = ["Full Name", "Email", "Phone", "Company Name", "Address", "WhatsApp Number", "Reminder Enabled (yes/no)", "Reminder Channels (email/whatsapp/both)"];
    const example = ["John Doe", "john@example.com", "08012345678", "Doe Inc", "123 Main St", "08012345678", "yes", "both"];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + example.join(",");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purpledger_bulk_clients_template.csv");
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

        const formatted = results.data.map((row: any) => ({
          full_name: row["Full Name"],
          email: row["Email"],
          phone: row["Phone"],
          company_name: row["Company Name"],
          address: row["Address"],
          whatsapp_number: row["WhatsApp Number"],
          reminder_enabled: String(row["Reminder Enabled (yes/no)"]).toLowerCase().trim() === "yes",
          reminder_channels: String(row["Reminder Channels (email/whatsapp/both)"]).toLowerCase().trim() === "both" ? ["email", "whatsapp"] : 
                             String(row["Reminder Channels (email/whatsapp/both)"]).toLowerCase().trim() === "whatsapp" ? ["whatsapp"] :
                             String(row["Reminder Channels (email/whatsapp/both)"]).toLowerCase().trim() === "email" ? ["email"] : [],
        })).filter((c) => c.full_name); // require at least full name

        setParsedData(formatted);
      },
      error: (err) => {
        setError("Failed to read the file. Please try again.");
      }
    });
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      setError("No valid clients found in the file.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const merchant = await getMerchant();
      if (!merchant) throw new Error("Could not verify merchant identity.");

      const result = await bulkCreateClientsAction(merchant.id, parsedData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/clients");
        }, 2000);
      } else {
        setError((result as any).error || "Failed to create bulk clients.");
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
        <p className="text-neutral-500">Your clients have been added. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="outline" size="icon" className="border-2 border-purp-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Bulk Client Import</h1>
          <p className="text-neutral-500 text-sm mt-1">Upload multiple clients at once using a CSV file.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Instructions */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-2 border-purp-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-bold text-purp-900">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-600">
              <p>1. Download the provided CSV template.</p>
              <p>2. Fill in your client details without changing the header row.</p>
              <p>3. <strong>Full Name</strong> is strictly required for every row.</p>
              <p>4. Save as a .csv file and upload it here.</p>
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
                <p className="font-semibold text-purp-900">Upload CSV File</p>
                <p className="text-xs text-neutral-500 mt-1">Max file size 5MB</p>
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
        <div className="md:col-span-2">
          <Card className="border-2 border-purp-200 shadow-none h-full flex flex-col">
            <CardHeader className="pb-3 border-b-2 border-purp-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-purp-900">Data Preview</CardTitle>
                {parsedData.length > 0 && (
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200">
                    {parsedData.length} valid row(s)
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
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Full Name</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Email</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">Company</TableHead>
                        <TableHead className="font-bold text-purp-900 whitespace-nowrap">WhatsApp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.full_name}</TableCell>
                          <TableCell className="text-neutral-500">{row.email || "-"}</TableCell>
                          <TableCell className="text-neutral-500">{row.company_name || "-"}</TableCell>
                          <TableCell className="text-neutral-500">{row.whatsapp_number || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 5 && (
                    <div className="p-3 text-center text-xs text-neutral-500 bg-neutral-50 border-t">
                      ...and {parsedData.length - 5} more rows
                    </div>
                  )}
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="p-4 border-t-2 border-purp-100 bg-white mt-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="w-full bg-purp-900 hover:bg-purp-700 text-white font-semibold h-11"
                  >
                    {isUploading ? "Importing Clients..." : `Import ${parsedData.length} Clients`}
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
