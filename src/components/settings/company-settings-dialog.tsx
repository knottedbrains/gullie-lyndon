"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CompanySettingsDialogProps {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanySettingsDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
}: CompanySettingsDialogProps) {
  const { data: settings, isLoading } = trpc.companies.getSettings.useQuery(
    { companyId },
    { enabled: open && companyId !== "unassigned" }
  );

  const updateSettings = trpc.companies.updateSettings.useMutation({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const [projectDefaults, setProjectDefaults] = useState({
    autoCreateHousingConversation: true,
    autoCreateMovingConversation: true,
    autoCreateServicesConversation: true,
    enableBudgetTracking: true,
    requireApprovals: false,
  });

  useEffect(() => {
    if (settings) {
      setProjectDefaults({
        autoCreateHousingConversation: settings.autoCreateHousingConversation ?? true,
        autoCreateMovingConversation: settings.autoCreateMovingConversation ?? true,
        autoCreateServicesConversation: settings.autoCreateServicesConversation ?? true,
        enableBudgetTracking: settings.enableBudgetTracking ?? true,
        requireApprovals: settings.requireApprovals ?? false,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      companyId,
      settings: projectDefaults,
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Company Settings: {companyName}</DialogTitle>
          <DialogDescription>
            Configure default settings for all projects in this company
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Project Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Project Defaults</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Budget Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track and monitor budgets for all projects
                  </p>
                </div>
                <Switch
                  checked={projectDefaults.enableBudgetTracking}
                  onCheckedChange={(checked) =>
                    setProjectDefaults((prev) => ({
                      ...prev,
                      enableBudgetTracking: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approvals</Label>
                  <p className="text-sm text-muted-foreground">
                    Services and expenses require approval before booking
                  </p>
                </div>
                <Switch
                  checked={projectDefaults.requireApprovals}
                  onCheckedChange={(checked) =>
                    setProjectDefaults((prev) => ({
                      ...prev,
                      requireApprovals: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Conversation Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Conversation Defaults</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-create Housing Conversation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create a housing conversation for new projects
                  </p>
                </div>
                <Switch
                  checked={projectDefaults.autoCreateHousingConversation}
                  onCheckedChange={(checked) =>
                    setProjectDefaults((prev) => ({
                      ...prev,
                      autoCreateHousingConversation: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-create Moving Conversation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create a moving conversation for new projects
                  </p>
                </div>
                <Switch
                  checked={projectDefaults.autoCreateMovingConversation}
                  onCheckedChange={(checked) =>
                    setProjectDefaults((prev) => ({
                      ...prev,
                      autoCreateMovingConversation: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-create Services Conversation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create a services conversation for new projects
                  </p>
                </div>
                <Switch
                  checked={projectDefaults.autoCreateServicesConversation}
                  onCheckedChange={(checked) =>
                    setProjectDefaults((prev) => ({
                      ...prev,
                      autoCreateServicesConversation: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isLoading}>
            {updateSettings.isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
