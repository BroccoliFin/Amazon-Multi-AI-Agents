"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AIProvider } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Cpu,
  Key,
  ShoppingCart,
  Search,
  Settings,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Zap,
  Star,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { FiBox, FiMessageSquare, FiGlobe } from "react-icons/fi";

const AI_PROVIDERS: {
  id: AIProvider;
  name: string;
  model: string;
  description: string;
  iconColor: string;
  Icon: React.ElementType;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    model: "GPT-4o",
    description: "Most capable model with strong reasoning and analysis",
    iconColor: "#10b981",
    Icon: FiBox,
  },
  {
    id: "claude",
    name: "Anthropic",
    model: "Claude Opus 4",
    description: "Excellent for nuanced analysis and long-form content",
    iconColor: "#6366f1",
    Icon: FiMessageSquare,
  },
  {
    id: "gemini",
    name: "Google",
    model: "Gemini 1.5 Pro",
    description: "Fast processing with multimodal capabilities",
    iconColor: "#f59e0b",
    Icon: FiGlobe,
  },
];

export function SettingsView() {
  const { settings, updateSettings } = useAppStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const toggleShowKey = (key: string) => {
    setShowKeys((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure AI providers, credentials, and workflow preferences
            </p>
          </div>
          <Button
            onClick={handleSave}
            icon={saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            variant={saved ? "success" : "primary"}
          >
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>

        {/* AI Provider Selection */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <Cpu className="h-4 w-4 text-indigo-500" />
              AI Model Provider
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select which AI model powers your agents
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {AI_PROVIDERS.map((provider) => {
                const isSelected = localSettings.aiProvider === provider.id;
                const hasKey = !!localSettings.apiKeys[provider.id];
                return (
                  <motion.button
                    key={provider.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                      setLocalSettings((p) => ({ ...p, aiProvider: provider.id }))
                    }
                    className={cn(
                      "relative text-left rounded-xl border p-4 transition-all duration-200",
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 shadow-sm shadow-indigo-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-4 w-4 text-indigo-500" />
                      </div>
                    )}
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
                      style={{ background: `${provider.iconColor}15`, border: `1px solid ${provider.iconColor}30` }}
                    >
                      <provider.Icon className="h-5 w-5" style={{ color: provider.iconColor }} />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{provider.name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: provider.iconColor }}>{provider.model}</p>
                    <p className="text-xs text-slate-400 mt-1">{provider.description}</p>
                    {hasKey ? (
                      <Badge variant="success" size="sm" className="mt-2">
                        Key configured
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" className="mt-2">
                        Key required
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <Key className="h-4 w-4 text-amber-500" />
              API Keys
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Keys are stored locally in your browser only
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {AI_PROVIDERS.map((provider) => (
              <div key={provider.id} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <provider.Icon className="h-3.5 w-3.5" style={{ color: provider.iconColor }} />
                  {provider.name} API Key
                  {localSettings.aiProvider === provider.id && (
                    <Badge variant="info" size="sm">Active</Badge>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showKeys[provider.id] ? "text" : "password"}
                    value={localSettings.apiKeys[provider.id]}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        apiKeys: { ...p.apiKeys, [provider.id]: e.target.value },
                      }))
                    }
                    placeholder={`sk-... or your ${provider.name} API key`}
                    className="w-full rounded-lg bg-white border border-slate-200 text-slate-800 px-3 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeys[provider.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-700">
                API keys are stored in localStorage and never transmitted to any server.
                All AI calls are made directly from your browser to the provider APIs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Amazon Credentials */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              Amazon Credentials
              <Badge variant="outline" size="sm">Optional</Badge>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Required only if the Shopping Agent is enabled
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Amazon Email"
              type="email"
              value={localSettings.amazonCredentials.email}
              onChange={(e) =>
                setLocalSettings((p) => ({
                  ...p,
                  amazonCredentials: { ...p.amazonCredentials, email: e.target.value },
                }))
              }
              placeholder="your@email.com"
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Amazon Password</label>
              <div className="relative">
                <input
                  type={showKeys["amazon"] ? "text" : "password"}
                  value={localSettings.amazonCredentials.password}
                  onChange={(e) =>
                    setLocalSettings((p) => ({
                      ...p,
                      amazonCredentials: { ...p.amazonCredentials, password: e.target.value },
                    }))
                  }
                  placeholder="Your Amazon password"
                  className="w-full rounded-lg bg-white border border-slate-200 text-slate-800 px-3 py-2.5 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("amazon")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["amazon"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Preferences */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <Search className="h-4 w-4 text-blue-500" />
              Search Preferences
            </h3>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Max Products */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Max Products to Analyze
                </span>
                <span className="text-indigo-600 font-bold">{localSettings.searchPreferences.maxProducts}</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={localSettings.searchPreferences.maxProducts}
                onChange={(e) =>
                  setLocalSettings((p) => ({
                    ...p,
                    searchPreferences: {
                      ...p.searchPreferences,
                      maxProducts: parseInt(e.target.value),
                    },
                  }))
                }
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5 (faster)</span><span>50 (more data)</span>
              </div>
            </div>

            {/* Min Rating */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Minimum Rating Filter
                </span>
                <span className="text-indigo-600 font-bold">
                  {localSettings.searchPreferences.minRating}★
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={localSettings.searchPreferences.minRating}
                onChange={(e) =>
                  setLocalSettings((p) => ({
                    ...p,
                    searchPreferences: {
                      ...p.searchPreferences,
                      minRating: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1★ (all)</span><span>5★ (best only)</span>
              </div>
            </div>

            {/* Max Price */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                Max Price Budget (optional)
              </label>
              <input
                type="number"
                value={localSettings.searchPreferences.maxPrice || ""}
                onChange={(e) =>
                  setLocalSettings((p) => ({
                    ...p,
                    searchPreferences: {
                      ...p.searchPreferences,
                      maxPrice: e.target.value ? parseFloat(e.target.value) : null,
                    },
                  }))
                }
                placeholder="No limit"
                className="w-full rounded-lg bg-white border border-slate-200 text-slate-800 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleCard
                label="Prime Only"
                icon={<Zap className="h-4 w-4 text-blue-500" />}
                description="Filter to Prime-eligible items"
                checked={localSettings.searchPreferences.primeOnly}
                onChange={(v) =>
                  setLocalSettings((p) => ({
                    ...p,
                    searchPreferences: { ...p.searchPreferences, primeOnly: v },
                  }))
                }
              />
              <ToggleCard
                label="Shopping Agent"
                icon={<ShoppingCart className="h-4 w-4 text-emerald-500" />}
                description="Enable automated purchasing"
                checked={localSettings.workflowPreferences.enableShopping}
                onChange={(v) =>
                  setLocalSettings((p) => ({
                    ...p,
                    workflowPreferences: { ...p.workflowPreferences, enableShopping: v },
                  }))
                }
              />
              <ToggleCard
                label="Auto Retry"
                icon={<RefreshCw className="h-4 w-4 text-purple-500" />}
                description="Retry failed agents automatically"
                checked={localSettings.workflowPreferences.autoRetry}
                onChange={(v) =>
                  setLocalSettings((p) => ({
                    ...p,
                    workflowPreferences: { ...p.workflowPreferences, autoRetry: v },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Workflow Preferences */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <Settings className="h-4 w-4 text-purple-500" />
              Workflow Settings
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-slate-700">
                Max Retry Attempts
                <span className="text-indigo-600 font-bold">
                  {localSettings.workflowPreferences.maxRetries}x
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={localSettings.workflowPreferences.maxRetries}
                onChange={(e) =>
                  setLocalSettings((p) => ({
                    ...p,
                    workflowPreferences: {
                      ...p.workflowPreferences,
                      maxRetries: parseInt(e.target.value),
                    },
                  }))
                }
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0 (no retry)</span><span>5 (aggressive)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            size="lg"
            icon={saved ? <CheckCircle className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            variant={saved ? "success" : "primary"}
          >
            {saved ? "Settings Saved!" : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleCard({
  label,
  icon,
  description,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200",
        checked
          ? "border-indigo-200 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <div
          className={cn(
            "h-5 w-9 rounded-full border transition-all duration-200",
            checked
              ? "bg-indigo-500 border-indigo-400"
              : "bg-slate-200 border-slate-300"
          )}
        >
          <div
            className={cn(
              "mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
              checked ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
    </button>
  );
}
