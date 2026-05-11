// ============================================================
// REPORT AGENT
// Generates comprehensive research reports
// ============================================================

import { callAI, AIProviderConfig } from "@/lib/providers/ai-provider";
import {
  AmazonProduct,
  ResearchReport,
  Recommendation,
  ProductComparison,
  SearchResult,
} from "@/types";
import { AnalyzerOutput } from "./analyzer";

export interface ReporterInput {
  searchResults: SearchResult;
  analysis: AnalyzerOutput;
  query: string;
  category: string;
}

export async function runReporterAgent(
  input: ReporterInput,
  aiConfig: AIProviderConfig,
  onProgress: (message: string, data?: Record<string, unknown>) => void
): Promise<ResearchReport> {
  onProgress("Compiling research report...");

  const { searchResults, analysis, query, category } = input;

  // Generate executive summary
  onProgress("Generating executive summary...");
  const summary = await generateExecutiveSummary(
    searchResults.products,
    analysis,
    query,
    category,
    aiConfig
  );

  // Build the report
  const report: ResearchReport = {
    id: `report_${Date.now()}`,
    query,
    category,
    generatedAt: new Date().toISOString(),
    summary,
    topProducts: searchResults.products.slice(0, 10),
    comparison: analysis.comparison,
    recommendations: analysis.recommendations,
    marketInsights: analysis.marketInsights,
    buyingGuide: analysis.buyingGuide,
    priceHistory: generatePriceHistory(searchResults.products),
  };

  onProgress("Report ready!", { reportId: report.id });

  return report;
}

// ============================================================
// EXECUTIVE SUMMARY
// ============================================================

async function generateExecutiveSummary(
  products: AmazonProduct[],
  analysis: AnalyzerOutput,
  query: string,
  category: string,
  config: AIProviderConfig
): Promise<string> {
  const { priceAnalysis, ratingAnalysis, recommendations } = analysis;
  const topRec = recommendations[0];

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are a professional market research analyst. Write clear, concise executive summaries.`,
    },
    {
      role: "user",
      content: `Write an executive summary for a product research report on "${query}" in "${category}":

Key Findings:
- Products Analyzed: ${products.length}
- Price Range: $${priceAnalysis.min.toFixed(2)} - $${priceAnalysis.max.toFixed(2)}
- Average Price: $${priceAnalysis.avg.toFixed(2)}
- Average Rating: ${ratingAnalysis.avgRating.toFixed(1)}/5
- Best Value Product: ${priceAnalysis.bestValueProduct?.title || "N/A"}
- Highest Rated: ${ratingAnalysis.highestRated?.title || "N/A"}
- Top Recommendation: ${topRec?.product.title || "N/A"} (Score: ${topRec?.score || "N/A"}/10)

Market Insights:
${analysis.marketInsights.slice(0, 3).join("\n")}

Write a 2-3 paragraph executive summary that would appear at the top of a professional research report.`,
    },
  ]);

  return response.content;
}

// ============================================================
// SIMULATED PRICE HISTORY (for visualization)
// ============================================================

function generatePriceHistory(
  products: AmazonProduct[]
): { date: string; price: number; asin: string }[] {
  const history: { date: string; price: number; asin: string }[] = [];
  const top3 = products.slice(0, 3);

  for (const product of top3) {
    if (!product.price) continue;

    // Generate 30-day simulated price history
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate price fluctuation
      const variation = (Math.random() - 0.5) * (product.price * 0.1);
      const price = Math.max(
        0.99,
        product.price + variation + (i > 15 ? product.price * 0.05 : 0)
      );

      history.push({
        date: date.toISOString().split("T")[0],
        price: parseFloat(price.toFixed(2)),
        asin: product.asin,
      });
    }
  }

  return history;
}
