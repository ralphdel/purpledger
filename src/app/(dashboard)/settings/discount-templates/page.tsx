"use client";

import { useState, useEffect } from "react";
import { Plus, Percent, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getDiscountTemplates, getMerchant } from "@/lib/data";
import { createDiscountTemplateAction, updateDiscountTemplateAction } from "@/lib/actions";
import type { DiscountTemplate } from "@/lib/types";

export default function DiscountTemplatesSettingsPage() {
  const [templates, setTemplates] = useState<DiscountTemplate[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DiscountTemplate | null>(null);

  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const m = await getMerchant();
    if (m) {
      setMerchantId(m.id);
      const data = await getDiscountTemplates(m.id);
      setTemplates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setName("");
    setPercentage("");
    setIsActive(true);
    setEditingTemplate(null);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: DiscountTemplate) => {
    setName(template.name);
    setPercentage(template.percentage.toString());
    setIsActive(template.is_active);
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }

    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Percentage must be between 0 and 100.");
      return;
    }

    setSaving(true);
    let result;

    if (editingTemplate) {
      result = await updateDiscountTemplateAction(editingTemplate.id, {
        name: name.trim(),
        percentage: pct,
        is_active: isActive,
      });
    } else {
      result = await createDiscountTemplateAction({
        merchant_id: merchantId,
        name: name.trim(),
        percentage: pct,
        is_active: isActive,
      });
    }

    setSaving(false);

    if (result.success) {
      setDialogOpen(false);
      resetForm();
      fetchData();
    } else {
      setError("Failed to save template: " + result.error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading templates...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/settings" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-purp-700 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Settings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Discount Templates</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage reusable discount templates (e.g. Early Payment, Loyalty)
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-purp-900 hover:bg-purp-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <Card className="border-2 border-purp-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-purp-900">Active Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Percent className="w-12 h-12 mx-auto mb-3 opacity-30 text-purp-700" />
              <p>No discount templates yet.</p>
              <Button variant="link" onClick={handleOpenAdd} className="text-purp-700 mt-2">
                Create a discount template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-purp-50 border-b-2 border-purp-200 hover:bg-purp-50">
                  <TableHead className="font-bold text-purp-900">Template Name</TableHead>
                  <TableHead className="font-bold text-purp-900">Discount Percentage</TableHead>
                  <TableHead className="font-bold text-purp-900">Status</TableHead>
                  <TableHead className="font-bold text-purp-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} className="border-b border-purp-200">
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="font-bold text-purp-700">
                      {template.percentage}%
                    </TableCell>
                    <TableCell>
                      {template.is_active ? (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(template)}
                        className="text-purp-700 hover:bg-purp-50 hover:text-purp-900"
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
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
              {editingTemplate ? "Edit Discount Template" : "Add Discount Template"}
            </DialogTitle>
            <DialogDescription className="sr-only">Add or edit a discount template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Template Name <span className="text-red-500">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50"
                placeholder="e.g. Loyalty Discount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Percentage (%) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50"
                placeholder="10"
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
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-2 border-purp-200">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purp-900 hover:bg-purp-700 text-white">
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
