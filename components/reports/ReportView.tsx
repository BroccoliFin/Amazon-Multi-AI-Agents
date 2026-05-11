"use client";

import { ResearchReport } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FileText,
  TrendingUp,
  Star,
  DollarSign,
  Award,
  Lightbulb,
  BookOpen,
  Clock,
} from "lucide-react";
import { FiDollarSign, FiStar, FiTag } from "react-icons/fi";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  report: ResearchReport;
}

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "products", label: "Products", icon: Star },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "guide", label: "Buying Guide", icon: BookOpen },
];

export function ReportView({ report }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Research Report</h2>
              <p className="text-sm text-slate-500">
                "{report.query}" · {report.category}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(report.generatedAt)}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Star className="h-4 w-4 text-amber-400" />}
          label="Products Found"
          value={report.topProducts.length.toString()}
          sub="analyzed"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          label="Price Range"
          value={`${formatPrice(Math.min(...report.topProducts.filter(p => p.price).map(p => p.price!)))}`}
          sub={`to ${formatPrice(Math.max(...report.topProducts.filter(p => p.price).map(p => p.price!)))}`}
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-indigo-400" />}
          label="Recommendations"
          value={report.recommendations.length.toString()}
          sub="curated picks"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
          label="Top Rating"
          value={
            report.topProducts.reduce((max, p) => Math.max(max, p.rating || 0), 0).toFixed(1) + "★"
          }
          sub="highest rated"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-600"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab report={report} />}
      {activeTab === "products" && <ProductsTab report={report} />}
      {activeTab === "analytics" && <AnalyticsTab report={report} />}
      {activeTab === "guide" && <GuideTab report={report} />}
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab({ report }: { report: ResearchReport }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            Executive Summary
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {report.summary}
          </p>
        </CardContent>
      </Card>

      {/* Comparison Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        {report.comparison.bestValue && (
          <HighlightCard
            title="Best Value"
            badge="Value Pick"
            badgeIcon={<FiDollarSign className="h-3 w-3" />}
            badgeVariant="success"
            product={report.comparison.bestValue}
          />
        )}
        {report.comparison.highestRated && (
          <HighlightCard
            title="Highest Rated"
            badge="Top Rated"
            badgeIcon={<FiStar className="h-3 w-3" />}
            badgeVariant="warning"
            product={report.comparison.highestRated}
          />
        )}
        {report.comparison.cheapest && (
          <HighlightCard
            title="Most Affordable"
            badge="Budget Pick"
            badgeIcon={<FiTag className="h-3 w-3" />}
            badgeVariant="info"
            product={report.comparison.cheapest}
          />
        )}
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Market Insights
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.marketInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700">Product Comparison</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">{report.comparison.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightCard({
  title,
  badge,
  badgeIcon,
  badgeVariant,
  product,
}: {
  title: string;
  badge: string;
  badgeIcon?: React.ReactNode;
  badgeVariant: "success" | "warning" | "info";
  product: ResearchReport["comparison"]["bestValue"];
}) {
  if (!product) return null;
  return (
    <Card glow={badgeVariant === "success" ? "emerald" : badgeVariant === "warning" ? "amber" : "blue"}>
      <CardContent className="p-4">
        <Badge variant={badgeVariant} size="sm">
          <span className="flex items-center gap-1">{badgeIcon}{badge}</span>
        </Badge>
        <h4 className="mt-2 text-xs font-medium text-slate-500">{title}</h4>
        <p className="mt-1 text-sm font-medium text-slate-700 line-clamp-2">{product.title}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800">{formatPrice(product.price)}</span>
          {product.rating && (
            <span className="text-xs text-amber-400">★ {product.rating.toFixed(1)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PRODUCTS TAB
// ============================================================

function ProductsTab({ report }: { report: ResearchReport }) {
  const recommendedAsins = new Set(report.recommendations.map((r) => r.product.asin));

  return (
    <div className="space-y-4">
      {/* Recommendations first */}
      {report.recommendations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-600 flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-400" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <div key={rec.product.asin} className="space-y-2">
                <ProductCard
                  product={rec.product}
                  rank={rec.rank}
                  isRecommended={i === 0}
                  score={rec.score}
                  index={i}
                />
                {/* Recommendation details */}
                <div className="ml-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-600 mb-2">{rec.reason}</p>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-emerald-600 mb-1">Pros</p>
                      {rec.pros.slice(0, 2).map((pro, j) => (
                        <p key={j} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-emerald-500 shrink-0">+</span>{pro}</p>
                      ))}
                    </div>
                    {rec.cons.length > 0 && (
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-500 mb-1">Cons</p>
                        {rec.cons.slice(0, 2).map((con, j) => (
                          <p key={j} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-red-400 shrink-0">−</span>{con}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-indigo-400">Best for: {rec.bestFor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All products */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-600">All Products</h3>
        <div className="space-y-3">
          {report.topProducts
            .filter((p) => !recommendedAsins.has(p.asin))
            .map((product, i) => (
              <ProductCard key={product.asin} product={product} rank={i + 1} index={i} />
            ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS TAB
// ============================================================

function AnalyticsTab({ report }: { report: ResearchReport }) {
  // Build chart data
  const priceData = report.topProducts
    .filter((p) => p.price)
    .slice(0, 8)
    .map((p) => ({
      name: p.title.split(" ").slice(0, 3).join(" "),
      price: p.price,
      rating: p.rating,
    }));

  const ratingDistribution = [
    { range: "4.5-5.0★", count: report.topProducts.filter((p) => (p.rating || 0) >= 4.5).length },
    { range: "4.0-4.5★", count: report.topProducts.filter((p) => (p.rating || 0) >= 4.0 && (p.rating || 0) < 4.5).length },
    { range: "3.5-4.0★", count: report.topProducts.filter((p) => (p.rating || 0) >= 3.5 && (p.rating || 0) < 4.0).length },
    { range: "<3.5★", count: report.topProducts.filter((p) => (p.rating || 0) < 3.5 && p.rating).length },
  ];

  const priceHistory = report.priceHistory || [];
  const top3Asins = [...new Set(priceHistory.map((p) => p.asin))].slice(0, 3);
  const priceHistoryByDate = priceHistory.reduce((acc, point) => {
    const existing = acc.find((a) => a.date === point.date);
    if (existing) {
      existing[point.asin] = point.price;
    } else {
      acc.push({ date: point.date, [point.asin]: point.price });
    }
    return acc;
  }, [] as Record<string, string | number>[]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Price vs Rating Scatter */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700">Price Comparison</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${value}`, "Price"]}
              />
              <Bar dataKey="price" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700">Rating Distribution</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ratingDistribution.map((item) => {
              const pct = report.topProducts.length > 0
                ? (item.count / report.topProducts.length) * 100
                : 0;
              return (
                <div key={item.range} className="flex items-center gap-3">
                  <span className="w-16 text-right text-xs text-slate-500">{item.range}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-slate-500">{item.count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 30-day Price Trend */}
      {priceHistoryByDate.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-700">30-Day Price Trend</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={priceHistoryByDate.slice(-30)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "12px",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`$${v}`, "Price"]}
                />
                {top3Asins.map((asin, i) => (
                  <Line
                    key={asin}
                    type="monotone"
                    dataKey={asin}
                    stroke={COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                    name={`Product ${i + 1}`}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<DollarSign className="h-4 w-4 text-emerald-400" />} label="Avg Price" value={formatPrice(report.topProducts.filter(p=>p.price).reduce((s,p)=>s+(p.price||0),0)/(report.topProducts.filter(p=>p.price).length||1))} sub="across all" />
        <StatCard icon={<Star className="h-4 w-4 text-amber-400" />} label="Avg Rating" value={(report.topProducts.filter(p=>p.rating).reduce((s,p)=>s+(p.rating||0),0)/(report.topProducts.filter(p=>p.rating).length||1)).toFixed(1)+"★"} sub="avg score" />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-blue-400" />} label="Prime Items" value={report.topProducts.filter(p=>p.isPrime).length.toString()} sub={`of ${report.topProducts.length} total`} />
        <StatCard icon={<Award className="h-4 w-4 text-purple-400" />} label="Discounted" value={report.topProducts.filter(p=>p.discount&&p.discount>0).length.toString()} sub="with deals" />
      </div>
    </div>
  );
}

// ============================================================
// GUIDE TAB
// ============================================================

function GuideTab({ report }: { report: ResearchReport }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            Complete Buying Guide
          </h3>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {report.buyingGuide}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Recommendations Summary */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-700">Quick Decision Guide</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((rec) => (
                <div key={rec.product.asin} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {rec.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{rec.product.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{rec.bestFor}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">{formatPrice(rec.product.price)}</span>
                      <span className="text-xs text-amber-400">★ {rec.product.rating?.toFixed(1)}</span>
                      <span className="text-xs text-indigo-400">Score: {rec.score.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
