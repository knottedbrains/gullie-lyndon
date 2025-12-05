"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AIConfig } from "./chat-interface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ChatConfigPanelProps {
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  onClose: () => void;
}

export function ChatConfigPanel({
  config,
  onConfigChange,
  onClose,
}: ChatConfigPanelProps) {
  return (
    <div className="border-l bg-background w-80 p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">AI Configuration</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={config.model}
            onValueChange={(value) =>
              onConfigChange({
                ...config,
                model: value as AIConfig["model"],
              })
            }
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* GPT-5.1 - Latest */}
              <SelectItem value="gpt-5.1">🚀 GPT-5.1 (Latest)</SelectItem>
              <SelectItem value="gpt-5.1-chat-latest">GPT-5.1 Chat Latest</SelectItem>
              <SelectItem value="gpt-5.1-2025-11-13">GPT-5.1 (Nov 2025)</SelectItem>

              {/* GPT-5 */}
              <SelectItem value="gpt-5">GPT-5</SelectItem>
              <SelectItem value="gpt-5-chat-latest">GPT-5 Chat Latest</SelectItem>
              <SelectItem value="gpt-5-pro">GPT-5 Pro (Most Capable)</SelectItem>
              <SelectItem value="gpt-5-mini">GPT-5 Mini (Balanced)</SelectItem>

              {/* GPT-4.1 */}
              <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>

              {/* GPT-4o */}
              <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
              <SelectItem value="gpt-4o-mini">⚡ GPT-4o Mini (Fast)</SelectItem>
              <SelectItem value="chatgpt-4o-latest">ChatGPT-4o Latest</SelectItem>

              {/* o1 - Reasoning */}
              <SelectItem value="o1">🧠 o1 (Reasoning)</SelectItem>
              <SelectItem value="o1-pro">o1 Pro (Advanced Reasoning)</SelectItem>
              <SelectItem value="o1-2024-12-17">o1 (Dec 2024)</SelectItem>

              {/* o3 - Latest Reasoning */}
              <SelectItem value="o3">🧠 o3 (Latest Reasoning)</SelectItem>
              <SelectItem value="o3-mini">o3 Mini (Fast Reasoning)</SelectItem>
              <SelectItem value="o3-mini-2025-01-31">o3 Mini (Jan 2025)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {config.model?.startsWith("o") && "Reasoning models provide extended thinking capabilities"}
            {config.model?.startsWith("gpt-5.1") && "Latest GPT-5.1 - Most advanced general model"}
            {config.model?.startsWith("gpt-5") && !config.model?.includes("5.1") && "GPT-5 - Highly capable with broad knowledge"}
            {config.model?.startsWith("gpt-4.1") && "GPT-4.1 - Enhanced version of GPT-4"}
            {config.model === "gpt-4o-mini" && "Fast and cost-effective for most tasks"}
            {config.model === "gpt-4o" && "Powerful multimodal model"}
          </p>
        </div>

        {/* Parallel Execution */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="parallel">Parallel Execution</Label>
            <p className="text-xs text-muted-foreground">
              Execute independent tools simultaneously
            </p>
          </div>
          <Switch
            id="parallel"
            checked={config.enableParallelExecution}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                enableParallelExecution: checked,
              })
            }
          />
        </div>

        {/* Extended Thinking */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="thinking">Extended Thinking</Label>
            <p className="text-xs text-muted-foreground">
              Enable for reasoning models (o1/o3)
            </p>
          </div>
          <Switch
            id="thinking"
            checked={config.enableExtendedThinking}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                enableExtendedThinking: checked,
              })
            }
          />
        </div>

        {/* Max Reasoning Tokens (only for reasoning models) */}
        {config.model?.startsWith("o") && config.enableExtendedThinking && (
          <div className="space-y-2">
            <Label htmlFor="tokens">Max Reasoning Tokens</Label>
            <Input
              id="tokens"
              type="number"
              min={1000}
              max={100000}
              step={1000}
              value={config.maxReasoningTokens || 10000}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  maxReasoningTokens: parseInt(e.target.value) || 10000,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Higher values allow more thorough reasoning
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t space-y-2">
        <h4 className="font-medium text-sm">Quick Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "gpt-4o-mini",
                enableParallelExecution: true,
                enableExtendedThinking: false,
              })
            }
          >
            ⚡ Fast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "gpt-5.1",
                enableParallelExecution: true,
                enableExtendedThinking: false,
              })
            }
          >
            🚀 Latest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "gpt-5-pro",
                enableParallelExecution: true,
                enableExtendedThinking: false,
              })
            }
          >
            💪 Pro
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "o1",
                enableParallelExecution: false,
                enableExtendedThinking: true,
                maxReasoningTokens: 15000,
              })
            }
          >
            🧠 Think
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "o3",
                enableParallelExecution: true,
                enableExtendedThinking: true,
                maxReasoningTokens: 25000,
              })
            }
          >
            🧠 Ultra
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConfigChange({
                model: "o1-pro",
                enableParallelExecution: false,
                enableExtendedThinking: true,
                maxReasoningTokens: 50000,
              })
            }
          >
            🧠 Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
