"use client";

import { useAppStore } from "@/store/useAppStore";
import { ReportView } from "@/components/reports/ReportView";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileText, Clock, Search } from "lucide-react";

export function ReportsView() {
  const { report, sessions, setActiveView } = useAppStore();

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 gap-6 bg-slate-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700">No Reports Yet</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">
            Run a product search workflow to generate your first AI research report
          </p>
        </div>
        <Button
          onClick={() => setActiveView("dashboard")}
          icon={<Search className="h-4 w-4" />}
        >
          Start Research
        </Button>

        {/* Past Sessions */}
        {sessions.length > 0 && (
          <div className="w-full max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Past Sessions
            </h3>
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.id} hover className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {session.userQuery}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" size="sm">{session.category}</Badge>
                        <span className="text-xs text-slate-400">{formatDate(session.startedAt)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={session.status === "completed" ? "success" : "error"}
                      size="sm"
                    >
                      {session.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50">
      <ReportView report={report} />
    </div>
  );
}
