import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { ProductReview } from "@/types";

// ============================================================
// AMAZON PRODUCT DETAIL + REVIEWS API ROUTE (server-side)
// ============================================================

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  Connection: "keep-alive",
  DNT: "1",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asin = searchParams.get("asin");

  if (!asin) {
    return NextResponse.json({ error: "ASIN required" }, { status: 400 });
  }

  try {
    // Fetch product page and reviews page in parallel
    const [productRes, reviewsRes] = await Promise.allSettled([
      fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: HEADERS,
        next: { revalidate: 0 },
      }),
      fetch(
        `https://www.amazon.com/product-reviews/${asin}?sortBy=recent&reviewerType=all_reviews&pageNumber=1`,
        { headers: HEADERS, next: { revalidate: 0 } }
      ),
    ]);

    const details: Record<string, unknown> = { asin };

    // ── Parse product page ──
    if (productRes.status === "fulfilled" && productRes.value.ok) {
      const html = await productRes.value.text();
      const $ = cheerio.load(html);

      // Title
      details.title =
        $("#productTitle").text().trim() ||
        $("h1 span#productTitle").text().trim();

      // Images — get all from the image block
      const images: string[] = [];
      // Primary image
      const mainImg = $("#landingImage").attr("src") || $("#imgBlkFront").attr("src");
      if (mainImg) images.push(mainImg);

      // Additional images from the thumbnail strip
      $("li.imageThumbnail img, #altImages img, .a-button-thumbnail img").each((_, img) => {
        const src = $(img).attr("src") || $(img).attr("data-src") || "";
        if (src && !src.includes("_SS40_") && !src.includes("_SX35_")) {
          // Upscale thumbnail to full image
          const full = src
            .replace(/_SS\d+_/, "_SL1500_")
            .replace(/_SX\d+_/, "_SL1500_")
            .replace(/_SY\d+_/, "_SL1500_")
            .replace(/_AC_US\d+_/, "_AC_SL1500_");
          if (!images.includes(full)) images.push(full);
        }
      });

      // Try data-a-dynamic-image for hi-res images
      const dynImgAttr = $("#landingImage").attr("data-a-dynamic-image");
      if (dynImgAttr) {
        try {
          const dynMap = JSON.parse(dynImgAttr) as Record<string, number[]>;
          const sorted = Object.entries(dynMap).sort(
            (a, b) => b[1][0] - a[1][0]
          );
          sorted.slice(0, 5).forEach(([url]) => {
            if (!images.includes(url)) images.push(url);
          });
        } catch {}
      }

      details.images = images.length ? images : undefined;

      // Price
      const priceWhole = $(".a-price-whole").first().text().replace(/[^0-9]/g, "");
      const priceFrac = $(".a-price-fraction").first().text().replace(/[^0-9]/g, "") || "00";
      if (priceWhole) {
        details.price = parseFloat(`${priceWhole}.${priceFrac}`);
      }

      // Original price
      const origText = $(".a-text-price .a-offscreen, #priceblock_ourprice").first().text();
      const origMatch = origText.match(/[\d,]+\.?\d*/);
      if (origMatch) {
        details.originalPrice = parseFloat(origMatch[0].replace(/,/g, ""));
      }

      // Rating
      const ratingText = $("span[data-hook='rating-out-of-text'], #acrPopover").attr("title") ||
        $("span.a-icon-alt").first().text();
      const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
      if (ratingMatch) details.rating = parseFloat(ratingMatch[1]);

      // Review count
      const rcText = $("#acrCustomerReviewText, [data-hook='total-review-count']").first().text();
      const rcMatch = rcText.match(/[\d,]+/);
      if (rcMatch) details.reviewCount = parseInt(rcMatch[0].replace(/,/g, ""), 10);

      // Brand
      details.brand =
        $("#bylineInfo .a-link-normal").first().text().trim().replace(/^Visit the |^Brand: /i, "") ||
        $("#brand").text().trim() ||
        null;

      // Features / bullet points
      const features: string[] = [];
      $("#feature-bullets ul li span.a-list-item").each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 5 && !text.toLowerCase().includes("make sure")) {
          features.push(text);
        }
      });
      details.features = features;

      // Description
      const descEl =
        $("#productDescription p, #productDescription_feature_div p, #aplus p").first();
      details.description = descEl.text().trim() || null;

      // Availability
      details.availability =
        $("#availability span, #outOfStock span").first().text().trim() || "In Stock";

      // Sold by
      details.soldBy =
        $("#merchant-info a, #tabular-buybox-container a.a-link-normal").first().text().trim() || null;

      // Prime
      details.isPrime = $("#primeBadge_feature_div, .a-icon-prime").length > 0;
    }

    // ── Parse reviews page ──
    const reviews: ProductReview[] = [];
    if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
      const rhtml = await reviewsRes.value.text();
      const $r = cheerio.load(rhtml);

      $r("[data-hook='review']").each((_, el) => {
        if (reviews.length >= 8) return false;

        const ratingText = $r(el).find("[data-hook='review-star-rating'], [data-hook='cmps-review-star-rating']").attr("class") || "";
        const ratingMatch = ratingText.match(/a-star-(\d)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

        const title = $r(el).find("[data-hook='review-title'] span:not(.a-icon-alt)").last().text().trim() ||
          $r(el).find("[data-hook='review-title']").text().trim();

        const body = $r(el).find("[data-hook='review-body'] span").text().trim();

        const author = $r(el).find(".a-profile-name").first().text().trim();

        const dateText = $r(el).find("[data-hook='review-date']").text().trim();

        const verified = $r(el).find("[data-hook='avp-badge']").length > 0;

        const helpfulText = $r(el).find("[data-hook='helpful-vote-statement']").text();
        const helpfulMatch = helpfulText.match(/(\d+)/);
        const helpful = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;

        if (title || body) {
          reviews.push({
            author: author || "Amazon Customer",
            rating,
            title: title || "Review",
            body: body || "",
            date: dateText || "",
            verified,
            helpful,
          });
        }
      });
    }

    details.reviews = reviews;

    return NextResponse.json(details);
  } catch (err) {
    return NextResponse.json({ error: String(err), asin }, { status: 200 });
  }
}
