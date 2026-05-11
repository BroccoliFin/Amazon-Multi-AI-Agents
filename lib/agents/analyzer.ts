// ============================================================
// ANALYSIS AGENT
// Compares products, analyzes pricing, ratings & features
// ============================================================

import { callAI, AIProviderConfig, extractJSON } from "@/lib/providers/ai-provider";
import { AmazonProduct, ProductComparison, Recommendation } from "@/types";

export interface AnalyzerInput {
  products: AmazonProduct[];
  query: string;
  category: string;
  userBudget?: number | null;
}

export interface AnalyzerOutput {
  comparison: ProductComparison;
  recommendations: Recommendation[];
  priceAnalysis: PriceAnalysis;
  ratingAnalysis: RatingAnalysis;
  marketInsights: string[];
  buyingGuide: string;
}

interface PriceAnalysis {
  min: number;
  max: number;
  avg: number;
  median: number;
  priceDistribution: { range: string; count: number }[];
  bestValueProduct: AmazonProduct | null;
}

interface RatingAnalysis {
  avgRating: number;
  avgReviews: number;
  highestRated: AmazonProduct | null;
  mostReviewed: AmazonProduct | null;
  ratingDistribution: { rating: string; count: number }[];
}

export async function runAnalyzerAgent(
  input: AnalyzerInput,
  aiConfig: AIProviderConfig,
  onProgress: (message: string, data?: Record<string, unknown>) => void
): Promise<AnalyzerOutput> {
  onProgress("Starting product analysis...", { productCount: input.products.length });

  // Step 1: Price analysis
  onProgress("Analyzing price distributions...");
  const priceAnalysis = analyzePrices(input.products);

  // Step 2: Rating analysis
  onProgress("Analyzing ratings and reviews...");
  const ratingAnalysis = analyzeRatings(input.products);

  // Step 3: AI-powered comparison
  onProgress("Running AI comparison analysis...");
  const comparison = await runAIComparison(
    input.products,
    input.query,
    priceAnalysis,
    ratingAnalysis,
    aiConfig
  );

  // Step 4: Generate recommendations
  onProgress("Generating personalized recommendations...");
  const recommendations = await generateRecommendations(
    input.products,
    input.query,
    input.category,
    input.userBudget,
    aiConfig
  );

  // Step 5: Market insights
  onProgress("Extracting market insights...");
  const marketInsights = await generateMarketInsights(
    input.products,
    input.query,
    input.category,
    aiConfig
  );

  // Step 6: Buying guide
  onProgress("Generating buying guide...");
  const buyingGuide = await generateBuyingGuide(
    input.products,
    input.query,
    input.category,
    recommendations,
    aiConfig
  );

  onProgress("Analysis complete!", { recommendationsCount: recommendations.length });

  return {
    comparison,
    recommendations,
    priceAnalysis,
    ratingAnalysis,
    marketInsights,
    buyingGuide,
  };
}

// ============================================================
// PRICE ANALYSIS
// ============================================================

function analyzePrices(products: AmazonProduct[]): PriceAnalysis {
  const priced = products.filter((p) => p.price !== null && p.price !== undefined);
  const prices = priced.map((p) => p.price as number).sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      priceDistribution: [],
      bestValueProduct: null,
    };
  }

  const min = prices[0];
  const max = prices[prices.length - 1];
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const median =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

  // Price distribution
  const ranges = [
    { label: `<$${Math.round(min + (max - min) * 0.25)}`, max: min + (max - min) * 0.25 },
    {
      label: `$${Math.round(min + (max - min) * 0.25)}-$${Math.round(min + (max - min) * 0.5)}`,
      max: min + (max - min) * 0.5,
    },
    {
      label: `$${Math.round(min + (max - min) * 0.5)}-$${Math.round(min + (max - min) * 0.75)}`,
      max: min + (max - min) * 0.75,
    },
    { label: `>$${Math.round(min + (max - min) * 0.75)}`, max: Infinity },
  ];

  const priceDistribution = ranges.map((r, i) => ({
    range: r.label,
    count: prices.filter(
      (p) =>
        p <= r.max &&
        (i === 0 ? true : p > ranges[i - 1].max)
    ).length,
  }));

  // Best value = highest (rating * reviews) / price
  const bestValueProduct =
    priced.reduce((best, p) => {
      if (!p.rating || !p.price) return best;
      const score =
        (p.rating * Math.log(p.reviewCount || 1)) / p.price;
      const bestScore = best
        ? (best.rating! * Math.log(best.reviewCount || 1)) / best.price!
        : 0;
      return score > bestScore ? p : best;
    }, null as AmazonProduct | null);

  return { min, max, avg, median, priceDistribution, bestValueProduct };
}

// ============================================================
// RATING ANALYSIS
// ============================================================

function analyzeRatings(products: AmazonProduct[]): RatingAnalysis {
  const rated = products.filter((p) => p.rating !== null);

  if (rated.length === 0) {
    return {
      avgRating: 0,
      avgReviews: 0,
      highestRated: null,
      mostReviewed: null,
      ratingDistribution: [],
    };
  }

  const avgRating =
    rated.reduce((s, p) => s + (p.rating || 0), 0) / rated.length;
  const avgReviews =
    rated.reduce((s, p) => s + (p.reviewCount || 0), 0) / rated.length;

  const highestRated = [...rated].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0)
  )[0];

  const mostReviewed = [...products]
    .filter((p) => p.reviewCount)
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))[0] || null;

  const ratingDistribution = [
    { rating: "5 stars", count: rated.filter((p) => (p.rating || 0) >= 4.8).length },
    { rating: "4-5 stars", count: rated.filter((p) => (p.rating || 0) >= 4.0 && (p.rating || 0) < 4.8).length },
    { rating: "3-4 stars", count: rated.filter((p) => (p.rating || 0) >= 3.0 && (p.rating || 0) < 4.0).length },
    { rating: "<3 stars", count: rated.filter((p) => (p.rating || 0) < 3.0).length },
  ];

  return {
    avgRating,
    avgReviews,
    highestRated: highestRated || null,
    mostReviewed,
    ratingDistribution,
  };
}

// ============================================================
// AI COMPARISON
// ============================================================

async function runAIComparison(
  products: AmazonProduct[],
  query: string,
  priceAnalysis: PriceAnalysis,
  ratingAnalysis: RatingAnalysis,
  config: AIProviderConfig
): Promise<ProductComparison> {
  const top5 = products.slice(0, 5);
  const productList = top5
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" - Price: $${p.price || "N/A"} - Rating: ${p.rating || "N/A"}/5 - Reviews: ${(p.reviewCount || 0).toLocaleString()}`
    )
    .join("\n");

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are an expert Amazon product analyst. Provide detailed, objective product comparisons. Return JSON only.`,
    },
    {
      role: "user",
      content: `Compare these Amazon products for the query "${query}":

${productList}

Price Range: $${priceAnalysis.min.toFixed(2)} - $${priceAnalysis.max.toFixed(2)} (avg: $${priceAnalysis.avg.toFixed(2)})
Average Rating: ${ratingAnalysis.avgRating.toFixed(1)}/5

Return JSON:
{
  "summary": "comprehensive 3-4 sentence comparison summary",
  "bestValueIndex": 0,
  "highestRatedIndex": 0,
  "cheapestIndex": 0
}

Index numbers refer to the product list (0-based).`,
    },
  ]);

  const parsed = extractJSON<{
    summary: string;
    bestValueIndex: number;
    highestRatedIndex: number;
    cheapestIndex: number;
  }>(response.content);

  return {
    products: top5,
    bestValue: top5[parsed?.bestValueIndex || 0] || priceAnalysis.bestValueProduct,
    highestRated: top5[parsed?.highestRatedIndex || 0] || ratingAnalysis.highestRated,
    cheapest: top5[parsed?.cheapestIndex || 0] || (top5.sort((a, b) => (a.price || 0) - (b.price || 0))[0]),
    summary: parsed?.summary || `Found ${products.length} products in the ${query} category.`,
  };
}

// ============================================================
// GENERATE RECOMMENDATIONS
// ============================================================

async function generateRecommendations(
  products: AmazonProduct[],
  query: string,
  category: string,
  budget: number | null | undefined,
  config: AIProviderConfig
): Promise<Recommendation[]> {
  const top10 = products.slice(0, 10);
  const productList = top10
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" | Price: $${p.price || "N/A"} | Rating: ${p.rating || "N/A"}/5 | Reviews: ${(p.reviewCount || 0).toLocaleString()} | Prime: ${p.isPrime ? "Yes" : "No"}`
    )
    .join("\n");

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are an expert Amazon product advisor. Provide detailed, actionable recommendations. Return valid JSON only.`,
    },
    {
      role: "user",
      content: `Create TOP 5 recommendations for query: "${query}" in category "${category}"
${budget ? `Budget: $${budget}` : ""}

Products to consider:
${productList}

Return JSON array of exactly 5 recommendations:
[
  {
    "productIndex": 0,
    "rank": 1,
    "reason": "detailed reason why this is recommended",
    "score": 9.2,
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"],
    "bestFor": "who should buy this"
  }
]

Score is 1-10. productIndex is 0-based index from the list above.`,
    },
  ]);

  const parsed = extractJSON<
    Array<{
      productIndex: number;
      rank: number;
      reason: string;
      score: number;
      pros: string[];
      cons: string[];
      bestFor: string;
    }>
  >(response.content);

  if (!parsed) return [];

  return parsed
    .filter((r) => top10[r.productIndex])
    .map((r) => ({
      rank: r.rank,
      product: top10[r.productIndex],
      reason: r.reason,
      score: r.score,
      pros: r.pros,
      cons: r.cons,
      bestFor: r.bestFor,
    }));
}

// ============================================================
// MARKET INSIGHTS
// ============================================================

async function generateMarketInsights(
  products: AmazonProduct[],
  query: string,
  category: string,
  config: AIProviderConfig
): Promise<string[]> {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
  const primes = products.filter((p) => p.isPrime).length;
  const withDiscount = products.filter((p) => p.discount && p.discount > 0).length;
  const avgPrice =
    products.filter((p) => p.price).reduce((s, p) => s + (p.price || 0), 0) /
    (products.filter((p) => p.price).length || 1);

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are a market research analyst. Provide concise, actionable market insights.`,
    },
    {
      role: "user",
      content: `Generate 5 key market insights for "${query}" in "${category}":

Data:
- Total products analyzed: ${products.length}
- Top brands: ${brands.slice(0, 5).join(", ")}
- Prime eligible: ${primes}/${products.length}
- Products with discounts: ${withDiscount}/${products.length}
- Average price: $${avgPrice.toFixed(2)}

Return a JSON array of exactly 5 concise insight strings (not objects, just strings):
["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]`,
    },
  ]);

  const parsed = extractJSON<string[]>(response.content);
  return parsed || [
    `Market shows ${brands.length} competing brands in the ${category} space`,
    `${Math.round((primes / products.length) * 100)}% of products qualify for Prime shipping`,
    `Average price point is $${avgPrice.toFixed(2)} with ${withDiscount} discounted items`,
    "Customer reviews indicate strong preference for established brands",
    "Price-to-quality ratio varies significantly across product tiers",
  ];
}

// ============================================================
// BUYING GUIDE
// ============================================================

async function generateBuyingGuide(
  products: AmazonProduct[],
  query: string,
  category: string,
  recommendations: Recommendation[],
  config: AIProviderConfig
): Promise<string> {
  const topRec = recommendations[0]?.product;

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are a consumer product expert. Write helpful, practical buying guides.`,
    },
    {
      role: "user",
      content: `Write a comprehensive buying guide for "${query}" in "${category}".
${topRec ? `Top recommended product: "${topRec.title}" at $${topRec.price}` : ""}

Include:
1. What to look for when buying
2. Key features that matter
3. Price vs quality considerations
4. Who needs which tier (budget/mid/premium)
5. Final recommendation

Write 4-5 paragraphs in a helpful, consumer-friendly tone.`,
    },
  ]);

  return response.content;
}
