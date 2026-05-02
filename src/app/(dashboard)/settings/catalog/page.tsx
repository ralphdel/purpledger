"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Pencil, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getItemCatalog, getMerchant } from "@/lib/data";
import { createItemCatalogAction, updateItemCatalogAction } from "@/lib/actions";
import type { ItemCatalog, Merchant } from "@/lib/types";
import { formatNaira } from "@/lib/calculations";

export default function CatalogSettingsPage() {
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [merchant, setMerchant] = useState<(Merchant & { permissions?: Record<string, boolean> }) | null>(null);
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalog | null>(null);

  const [itemName, setItemName] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const m = await getMerchant();
    if (m) {
      setMerchant(m);
      setMerchantId(m.id);
      const data = await getItemCatalog(m.id);
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setItemName("");
    setDefaultRate("");
    setDescription("");
    setIsActive(true);
    setEditingItem(null);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: ItemCatalog) => {
    setItemName(item.item_name);
    setDefaultRate(item.default_rate.toString());
    setDescription(item.description || "");
    setIsActive(item.is_active);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    setSaving(true);
    let result;

    if (editingItem) {
      result = await updateItemCatalogAction(editingItem.id, {
        item_name: itemName.trim(),
        default_rate: parseFloat(defaultRate) || 0,
        description: description.trim() || undefined,
        is_active: isActive,
      });
    } else {
      result = await createItemCatalogAction({
        merchant_id: merchantId,
        item_name: itemName.trim(),
        default_rate: parseFloat(defaultRate) || 0,
        description: description.trim() || undefined,
        is_active: isActive,
      });
    }

    setSaving(false);

    if (result.success) {
      setDialogOpen(false);
      resetForm();
      fetchData();
    } else {
      setError("Failed to save item: " + result.error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading catalog...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/settings" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-purp-700 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Settings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Item Catalog</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage your predefined products and services for quicker invoicing
          </p>
        </div>
        {(!merchant?.permissions || merchant.permissions.manage_item_catalog) && (
        <Button onClick={handleOpenAdd} className="bg-purp-900 hover:bg-purp-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
        )}
      </div>

      <Card className="border-2 border-purp-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-purp-900">Catalog Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30 text-purp-700" />
              <p>No items in your catalog yet.</p>
              {(!merchant?.permissions || merchant.permissions.manage_item_catalog) && (
              <Button variant="link" onClick={handleOpenAdd} className="text-purp-700 mt-2">
                Create your first item
              </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-purp-50 border-b-2 border-purp-200 hover:bg-purp-50">
                  <TableHead className="font-bold text-purp-900">Item Name</TableHead>
                  <TableHead className="font-bold text-purp-900">Description</TableHead>
                  <TableHead className="font-bold text-purp-900">Default Rate</TableHead>
                  <TableHead className="font-bold text-purp-900">Status</TableHead>
                  <TableHead className="font-bold text-purp-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-b border-purp-200">
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="text-neutral-500 text-sm max-w-xs truncate">
                      {item.description || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-700">
                      {formatNaira(item.default_rate)}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-neutral-100 text-neutral-500 border-neutral-200 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(!merchant?.permissions || merchant.permissions.manage_item_catalog) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="text-purp-700 hover:bg-purp-50 hover:text-purp-900"
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="border-2 border-purp-200">
          <DialogHeader>
            <DialogTitle className="text-purp-900">
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </DialogTitle>
            <DialogDescription className="sr-only">Add or edit an item in your catalog</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Item Name <span className="text-red-500">*</span></Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50"
                placeholder="e.g. Website Design"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Default Rate (₦)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-neutral-400 font-normal">(optional)</span></Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50 resize-none h-20"
                placeholder="Brief description of the item"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className="w-10 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purp-700"></div>
              </label>
              <span className="text-sm font-medium">Active (Visible in invoices)</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-2 border-purp-200">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purp-900 hover:bg-purp-700 text-white">
              {saving ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
