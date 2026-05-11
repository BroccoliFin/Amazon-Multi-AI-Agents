"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Clothing",
  "Home & Kitchen",
  "Sports",
  "Toys",
  "Health & Beauty",
  "Automotive",
  "Office Products",
  "Tools",
];

const EXAMPLE_QUERIES = [
  "Best wireless headphones under $200",
  "Top rated air fryers 2024",
  "Gaming laptops with RTX 4060",
  "Yoga mats for beginners",
  "Coffee makers with grinder",
  "Running shoes for flat feet",
];

interface SearchPanelProps {
  onSearch: (query: string, category: string) => void;
  isRunning: boolean;
}

export function SearchPanel({ onSearch, isRunning }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showExamples, setShowExamples] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch(query.trim(), category);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center rounded-xl border transition-all duration-300 bg-white",
            isRunning
              ? "border-indigo-300 shadow-md shadow-indigo-100"
              : "border-slate-200 focus-within:border-indigo-300 focus-within:shadow-md focus-within:shadow-indigo-100"
          )}
        >
          <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for products on Amazon..."
            disabled={isRunning}
            className={cn(
              "flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-800",
              "placeholder:text-slate-400 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <Button
            onClick={handleSearch}
            disabled={isRunning || !query.trim()}
            loading={isRunning}
            className="m-1.5"
            size="md"
          >
            {isRunning ? "Running..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Category + Example */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              disabled={isRunning}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                "border",
                category === cat
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Examples toggle */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors ml-auto"
        >
          <Sparkles className="h-3 w-3" />
          Examples
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showExamples && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Example queries */}
      {showExamples && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2"
        >
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                setShowExamples(false);
              }}
              disabled={isRunning}
              className={cn(
                "rounded-lg border border-slate-200 bg-white px-3 py-1.5",
                "text-xs text-slate-500 hover:border-indigo-200 hover:text-slate-700 hover:bg-indigo-50",
                "transition-all duration-200"
              )}
            >
              {example}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
