import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ============================================================
// AMAZON BESTSELLERS API ROUTE (server-side)
// ============================================================

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  Connection: "keep-alive",
};

const CATEGORY_URLS: Record<string, string> = {
  Electronics: "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/",
  Books: "https://www.amazon.com/Best-Sellers-Books/zgbs/books/",
  "Home & Kitchen": "https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden/",
  Toys: "https://www.amazon.com/Best-Sellers-Toys-Games/zgbs/toys-and-games/",
  Clothing: "https://www.amazon.com/Best-Sellers-Clothing/zgbs/fashion/",
  Sports: "https://www.amazon.com/Best-Sellers-Sports-Outdoors/zgbs/sporting-goods/",
  "Health & Beauty": "https://www.amazon.com/Best-Sellers-Health-Personal-Care/zgbs/hpc/",
  All: "https://www.amazon.com/best-sellers/zgbs/",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "All";
  const max = Math.min(parseInt(searchParams.get("max") || "10", 10), 20);

  const url = CATEGORY_URLS[category] || CATEGORY_URLS.All;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ products: [], error: `Amazon returned ${res.status}` });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: Record<string, unknown>[] = [];

    // Bestseller list items
    $(".zg-grid-general-faceout, .p13n-sc-uncoverable-faceout, [id^='gridItemRoot']").each((_, el) => {
      if (products.length >= max) return false;

      const asin =
        $(el).find("a[href*='/dp/']").attr("href")?.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
        $(el).attr("data-asin");
      if (!asin || asin.length !== 10) return;

      const title =
        $(el).find("._cDEzb_p13n-sc-css-line-clamp-3_g3dy1, .p13n-sc-truncated, a span, .a-size-base").first().text().trim();
      if (!title || title.length < 3) return;

      const imageUrl =
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src") || "";

      const priceText = $(el).find(".a-price .a-offscreen, .p13n-sc-price").first().text();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, "")) : null;

      const ratingText = $(el).find(".a-icon-alt").first().text();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

      const rankText = $(el).find(".zg-bdg-text, .p13n-sc-badge-label").first().text();
      const rankMatch = rankText.match(/\d+/);
      const rank = rankMatch ? parseInt(rankMatch[0]) : products.length + 1;

      const relHref = $(el).find("a[href*='/dp/']").first().attr("href") || `/dp/${asin}`;
      const productUrl = relHref.startsWith("http")
        ? relHref
        : `https://www.amazon.com${relHref}`;

      products.push({
        asin,
        title,
        price,
        originalPrice: null,
        rating,
        reviewCount: null,
        imageUrl,
        images: imageUrl ? [imageUrl] : [],
        productUrl,
        category,
        brand: null,
        isPrime: false,
        discount: null,
        rank,
        features: [],
        description: null,
        reviews: [],
        availability: "In Stock",
        soldBy: null,
      });
    });

    return NextResponse.json({ products, total: products.length });
  } catch (err) {
    return NextResponse.json({ products: [], error: String(err) });
  }
}
