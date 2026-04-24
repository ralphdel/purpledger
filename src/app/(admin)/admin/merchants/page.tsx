"use client";

import { useEffect, useState } from "react";
import { Users, Search, ShieldCheck, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/calculations";
import type { Merchant } from "@/lib/types";
import { adminDeactivateMerchantAction, adminDeleteMerchantAction, adminReactivateMerchantAction } from "@/lib/actions";
import { MoreHorizontal, Ban, Trash2, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ModalState = 
  | { type: "deactivate"; merchant: Merchant }
  | { type: "reactivate"; merchant: Merchant }
  | { type: "delete"; merchant: Merchant; confirmName: string; error: string | null }
  | null;

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [processing, setProcessing] = useState(false);

  const fetchMerchants = () => {
    setLoading(true);
    const sb = createClient();
    sb.from("merchants")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMerchants((data || []) as Merchant[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleConfirmDeactivate = async () => {
    if (modal?.type !== "deactivate") return;
    setProcessing(true);
    await adminDeactivateMerchantAction(modal.merchant.id);
    fetchMerchants();
    setModal(null);
    setProcessing(false);
  };

  const handleConfirmReactivate = async () => {
    if (modal?.type !== "reactivate") return;
    setProcessing(true);
    await adminReactivateMerchantAction(modal.merchant.id);
    fetchMerchants();
    setModal(null);
    setProcessing(false);
  };

  const handleConfirmDelete = async () => {
    if (modal?.type !== "delete") return;
    if (modal.confirmName !== modal.merchant.business_name) {
      setModal({ ...modal, error: "Business name did not match. Please try again." });
      return;
    }
    setProcessing(true);
    await adminDeleteMerchantAction(modal.merchant.id);
    fetchMerchants();
    setModal(null);
    setProcessing(false);
  };

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
                <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 text-neutral-500 hover:text-purp-900 hover:bg-neutral-100 rounded-md inline-flex items-center justify-center transition-colors focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.verification_status === "suspended" ? (
                          <DropdownMenuItem className="cursor-pointer text-emerald-600" onClick={() => setModal({ type: "reactivate", merchant: m })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate Access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="cursor-pointer text-amber-600" onClick={() => setModal({ type: "deactivate", merchant: m })}>
                            <Ban className="mr-2 h-4 w-4" /> Deactivate / Suspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => setModal({ type: "delete", merchant: m, confirmName: "", error: null })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500 text-sm">
                    No merchants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deactivate Modal */}
      <Dialog open={modal?.type === "deactivate"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="border-2 border-amber-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Ban className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-amber-700">Suspend Merchant</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              Are you sure you want to suspend <strong>{modal?.type === "deactivate" ? modal.merchant.business_name : ""}</strong>? They will immediately lose access to their dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModal(null)} disabled={processing} className="border-2">Cancel</Button>
            <Button onClick={handleConfirmDeactivate} disabled={processing} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              {processing ? "Suspending..." : "Suspend Merchant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Modal */}
      <Dialog open={modal?.type === "reactivate"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="border-2 border-emerald-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <DialogTitle className="text-emerald-700">Reactivate Merchant</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              Reactivate <strong>{modal?.type === "reactivate" ? modal.merchant.business_name : ""}</strong>? They will immediately regain full access to their dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModal(null)} disabled={processing} className="border-2">Cancel</Button>
            <Button onClick={handleConfirmReactivate} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {processing ? "Reactivating..." : "Reactivate Merchant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={modal?.type === "delete"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="border-2 border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-red-600">Permanently Delete Merchant</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              This will permanently delete <strong>{modal?.type === "delete" ? modal.merchant.business_name : ""}</strong> and <strong>ALL their data</strong> — invoices, clients, team members, and payments. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <Label className="text-sm font-semibold text-neutral-700">
              Type the business name to confirm: <span className="text-red-600 font-mono">{modal?.type === "delete" ? modal.merchant.business_name : ""}</span>
            </Label>
            <Input
              value={modal?.type === "delete" ? modal.confirmName : ""}
              onChange={(e) => modal?.type === "delete" && setModal({ ...modal, confirmName: e.target.value, error: null })}
              placeholder="Type business name exactly..."
              className="border-2 border-red-200 focus:border-red-400"
            />
            {modal?.type === "delete" && modal.error && (
              <p className="text-sm text-red-600 font-medium">{modal.error}</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModal(null)} disabled={processing} className="border-2">Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={processing || (modal?.type === "delete" ? modal.confirmName !== modal.merchant.business_name : true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
            >
              {processing ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
