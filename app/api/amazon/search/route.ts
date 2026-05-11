import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ============================================================
// AMAZON SEARCH API ROUTE  (server-side – no CORS issues)
// ============================================================

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "max-age=0",
  Connection: "keep-alive",
  DNT: "1",
};

const CATEGORY_MAP: Record<string, string> = {
  All: "aps",
  Electronics: "electronics",
  Books: "stripbooks",
  Clothing: "fashion",
  "Home & Kitchen": "garden",
  Sports: "sporting",
  Toys: "toys-and-games",
  "Health & Beauty": "hpc",
  Automotive: "automotive",
  "Office Products": "office-products",
  Tools: "tools",
};

function parsePrice(text: string): number | null {
  if (!text) return null;
  const m = text.match(/[\d,]+\.?\d*/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function parseCount(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "All";
  const max = Math.min(parseInt(searchParams.get("max") || "20", 10), 40);

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const searchNode = CATEGORY_MAP[category] || "aps";
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=${searchNode}`;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Amazon returned ${res.status}`, products: [] },
        { status: 200 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: ReturnType<typeof buildProduct>[] = [];

    $('[data-component-type="s-search-result"]').each((_, el) => {
      if (products.length >= max) return false;
      const p = buildProduct($, el, category);
      if (p) products.push(p);
    });

    return NextResponse.json({ products, total: products.length });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), products: [] },
      { status: 200 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildProduct($: cheerio.CheerioAPI, el: any, category: string) {
  const asin = $(el).attr("data-asin");
  if (!asin || asin.length !== 10) return null;

  // ── Title ──
  const title =
    $(el).find("h2 a span").first().text().trim() ||
    $(el).find("[data-cy='title-recipe'] span").first().text().trim() ||
    $(el).find("h2 span").first().text().trim();
  if (!title || title.length < 3) return null;

  // ── Image ──
  const imageUrl =
    $(el).find("img.s-image").attr("src") ||
    $(el).find(".s-product-image-container img").attr("src") ||
    "";

  // ── Price ──
  const wholePart = $(el).find(".a-price-whole").first().text().replace(/[^0-9]/g, "");
  const fracPart = $(el).find(".a-price-fraction").first().text().replace(/[^0-9]/g, "") || "00";
  const priceStr = wholePart ? `${wholePart}.${fracPart}` : "";
  const price = priceStr ? parseFloat(priceStr) : null;

  // Original / strike-through price
  const originalPriceText = $(el).find(".a-text-price .a-offscreen").first().text();
  const originalPrice = parsePrice(originalPriceText);

  // Discount badge
  const discountText = $(el).find(".a-badge-text, .savingPriceOverride").first().text();
  const discountMatch = discountText.match(/(\d+)%/);
  const discount = discountMatch ? parseInt(discountMatch[1]) : null;

  // ── Rating ──
  const ratingText = $(el).find(".a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt").first().text();
  const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // ── Review count ──
  const reviewText = $(el).find("[data-cy='reviews-block'] .a-size-base, .a-section .a-link-normal .a-size-base").first().text();
  const reviewCount = parseCount(reviewText);

  // ── Prime ──
  const isPrime =
    $(el).find(".s-prime, [aria-label*='Prime'], .a-icon-prime").length > 0;

  // ── Brand ──
  const brand =
    $(el).find(".a-row .a-size-base.a-color-secondary").first().text().trim() ||
    null;

  // ── Product URL ──
  const relHref =
    $(el).find("h2 a").attr("href") ||
    $(el).find("a.a-link-normal[href*='/dp/']").first().attr("href") ||
    `/dp/${asin}`;
  const productUrl = relHref.startsWith("http")
    ? relHref
    : `https://www.amazon.com${relHref}`;

  return {
    asin,
    title,
    price,
    originalPrice:
      originalPrice && price && originalPrice > price ? originalPrice : null,
    rating,
    reviewCount,
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    productUrl,
    category,
    brand,
    isPrime,
    discount:
      discount ??
      (originalPrice && price && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null),
    rank: null,
    features: [],
    description: null,
    reviews: [],
    availability: null,
    soldBy: null,
  };
}
