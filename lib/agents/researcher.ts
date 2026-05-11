// ============================================================
// RESEARCH AGENT
// Searches Amazon for products based on user query
// ============================================================

import { callAI, AIProviderConfig, extractJSON } from "@/lib/providers/ai-provider";
import {
  searchAmazonProducts,
  getTopSellingProducts,
  enrichProducts,
  generateMockProducts,
} from "@/lib/tools/amazon-scraper";
import { AmazonProduct, SearchResult } from "@/types";

export interface ResearchAgentInput {
  query: string;
  category: string;
  maxProducts: number;
  minRating: number;
  primeOnly: boolean;
}

export interface ResearchAgentOutput {
  searchResults: SearchResult;
  topProducts: AmazonProduct[];
  categories: string[];
  suggestedQueries: string[];
  summary: string;
}

export async function runResearchAgent(
  input: ResearchAgentInput,
  aiConfig: AIProviderConfig,
  onProgress: (message: string, data?: Record<string, unknown>) => void
): Promise<ResearchAgentOutput> {
  onProgress("Starting product research...", { query: input.query });

  // Step 1: AI analyzes the query to optimize search
  onProgress("Analyzing search query with AI...");
  const queryAnalysis = await analyzeQuery(input.query, input.category, aiConfig);
  onProgress("Query analysis complete", { analysis: queryAnalysis });

  // Step 2: Search Amazon
  onProgress(`Searching Amazon for: "${queryAnalysis.optimizedQuery}"...`);
  let products = await searchAmazonProducts(
    queryAnalysis.optimizedQuery,
    input.category,
    input.maxProducts * 2
  );

  // Step 3: Also get top selling products
  onProgress("Fetching top selling products in category...");
  const topSellers = await getTopSellingProducts(input.category, 10);

  // Merge and deduplicate
  const allProducts = mergeProducts(products, topSellers);

  // Step 4: Filter products
  onProgress("Filtering products based on preferences...");
  let filtered = allProducts.filter((p) => {
    if (input.minRating && p.rating && p.rating < input.minRating) return false;
    if (input.primeOnly && !p.isPrime) return false;
    return true;
  });

  // Fallback to mock if no results
  if (filtered.length === 0) {
    onProgress("Using simulated data for demonstration...");
    filtered = generateMockProducts(input.query, input.category, input.maxProducts);
  }

  // Take top results
  const topProducts = filtered.slice(0, input.maxProducts);

  // Step 5: Fetch real details + reviews for top 5 products from Amazon
  onProgress("Fetching real product details and reviews...");
  const detailEnriched = await enrichProducts(topProducts, 5);

  // Step 6: AI enriches remaining product metadata
  onProgress("AI enriching product information...");
  const enrichedProducts = await enrichProductsWithAI(
    detailEnriched,
    input.query,
    aiConfig
  );

  const searchResult: SearchResult = {
    query: input.query,
    category: input.category,
    products: enrichedProducts,
    totalFound: enrichedProducts.length,
    searchedAt: new Date().toISOString(),
  };

  // Step 6: AI generates search summary
  onProgress("Generating research summary...");
  const summary = await generateResearchSummary(
    enrichedProducts,
    input.query,
    input.category,
    aiConfig
  );

  onProgress("Research complete!", { productsFound: enrichedProducts.length });

  return {
    searchResults: searchResult,
    topProducts: enrichedProducts,
    categories: queryAnalysis.relatedCategories,
    suggestedQueries: queryAnalysis.suggestedQueries,
    summary,
  };
}

// ============================================================
// AI QUERY ANALYSIS
// ============================================================

async function analyzeQuery(
  query: string,
  category: string,
  config: AIProviderConfig
): Promise<{
  optimizedQuery: string;
  relatedCategories: string[];
  suggestedQueries: string[];
  intent: string;
}> {
  const response = await callAI(config, [
    {
      role: "system",
      content: `You are an Amazon product search expert. Analyze user queries and optimize them for Amazon search. Return JSON only.`,
    },
    {
      role: "user",
      content: `Analyze this Amazon search query and return a JSON object:
Query: "${query}"
Category: "${category}"

Return JSON with:
{
  "optimizedQuery": "optimized search query for Amazon",
  "relatedCategories": ["category1", "category2"],
  "suggestedQueries": ["alternative query 1", "alternative query 2", "alternative query 3"],
  "intent": "brief description of user intent"
}`,
    },
  ]);

  const parsed = extractJSON<{
    optimizedQuery: string;
    relatedCategories: string[];
    suggestedQueries: string[];
    intent: string;
  }>(response.content);

  return parsed || {
    optimizedQuery: query,
    relatedCategories: [category],
    suggestedQueries: [query],
    intent: "Product search",
  };
}

// ============================================================
// AI PRODUCT ENRICHMENT
// ============================================================

async function enrichProductsWithAI(
  products: AmazonProduct[],
  query: string,
  config: AIProviderConfig
): Promise<AmazonProduct[]> {
  if (products.length === 0) return products;

  const productSummary = products
    .slice(0, 15)
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} - $${p.price} - Rating: ${p.rating}/5 - Reviews: ${p.reviewCount}`
    )
    .join("\n");

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are an Amazon product expert. Analyze products and add insights. Return valid JSON only.`,
    },
    {
      role: "user",
      content: `For this user query: "${query}", analyze these Amazon products:

${productSummary}

Return a JSON array of product enhancements (in the same order):
[
  {
    "index": 0,
    "brand": "extracted or inferred brand name",
    "features": ["key feature 1", "key feature 2", "key feature 3"],
    "description": "brief product description",
    "targetAudience": "who this is best for"
  }
]

Return JSON array ONLY.`,
    },
  ]);

  const enhancements = extractJSON<
    Array<{
      index: number;
      brand: string;
      features: string[];
      description: string;
      targetAudience: string;
    }>
  >(response.content);

  if (!enhancements) return products;

  return products.map((product, i) => {
    const enhancement = enhancements.find((e) => e.index === i);
    if (!enhancement) return product;
    return {
      ...product,
      brand: enhancement.brand || product.brand,
      features: enhancement.features || product.features,
      description: enhancement.description || product.description,
    };
  });
}

// ============================================================
// GENERATE RESEARCH SUMMARY
// ============================================================

async function generateResearchSummary(
  products: AmazonProduct[],
  query: string,
  category: string,
  config: AIProviderConfig
): Promise<string> {
  const priceRange = products.filter((p) => p.price).map((p) => p.price as number);
  const minPrice = priceRange.length ? Math.min(...priceRange) : 0;
  const maxPrice = priceRange.length ? Math.max(...priceRange) : 0;
  const avgRating =
    products.filter((p) => p.rating).reduce((s, p) => s + (p.rating || 0), 0) /
    (products.filter((p) => p.rating).length || 1);

  const response = await callAI(config, [
    {
      role: "system",
      content: `You are a professional Amazon product researcher. Write concise, insightful market research summaries.`,
    },
    {
      role: "user",
      content: `Write a brief research summary (3-4 sentences) for:
Query: "${query}"
Category: "${category}"
Products Found: ${products.length}
Price Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}
Average Rating: ${avgRating.toFixed(1)}/5
Top Products: ${products
        .slice(0, 3)
        .map((p) => p.title)
        .join(", ")}

Write a professional research summary.`,
    },
  ]);

  return response.content;
}

// ============================================================
// HELPERS
// ============================================================

function mergeProducts(primary: AmazonProduct[], secondary: AmazonProduct[]): AmazonProduct[] {
  const seen = new Set(primary.map((p) => p.asin));
  const unique = secondary.filter((p) => !seen.has(p.asin));
  return [...primary, ...unique];
}
