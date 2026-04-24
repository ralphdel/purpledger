"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Search,
  Filter,
  User,
  ShieldCheck,
  Settings,
  DollarSign,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { AuditLog } from "@/lib/types";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const sb = createClient();
    sb.from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data || []) as AuditLog[]);
        setLoading(false);
      });
  }, []);

  const eventIcons: Record<string, React.ElementType> = {
    payment: DollarSign,
    verification: ShieldCheck,
    settings: Settings,
    invoice: FileText,
    user: User,
  };

  const roleColors: Record<string, string> = {
    merchant: "bg-purple-50 text-purple-700 border-purple-200",
    admin: "bg-red-50 text-red-700 border-red-200",
    system: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const filteredLogs = logs.filter((log) =>
    log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.actor_role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Audit Trail</h1>
        <Card className="border shadow-none animate-pulse">
          <CardContent className="p-6"><div className="h-48 bg-neutral-100 rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Audit Trail</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Complete log of all platform events — {logs.length} entries
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          placeholder="Search events..."
          className="pl-10 border-2 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <ScrollText className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
              <p className="text-sm">No audit logs found. Events will appear here as the platform is used.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const IconComponent = eventIcons[log.event_type.split(".")[0]] || ScrollText;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 bg-neutral-100 border border-neutral-200 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconComponent className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{log.event_type}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          {JSON.stringify(log.metadata).slice(0, 120)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="outline" className={`text-[10px] uppercase font-semibold border-2 ${roleColors[log.actor_role] || ""}`}>
                        {log.actor_role}
                      </Badge>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-NG", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
