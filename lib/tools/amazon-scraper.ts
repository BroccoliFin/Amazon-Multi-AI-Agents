// ============================================================
// AMAZON DATA FETCHING — calls internal Next.js API routes
// which run server-side (no CORS, real cheerio parsing)
// ============================================================

import { AmazonProduct } from "@/types";

const API_BASE = "/api/amazon";

// ============================================================
// SEARCH
// ============================================================

export async function searchAmazonProducts(
  query: string,
  category: string = "All",
  maxResults: number = 20
): Promise<AmazonProduct[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      category,
      max: String(maxResults),
    });
    const res = await fetch(`${API_BASE}/search?${params}`);
    if (!res.ok) throw new Error(`Search API ${res.status}`);

    const data = await res.json();
    const products: AmazonProduct[] = data.products ?? [];
    return products;
  } catch (err) {
    console.error("searchAmazonProducts error:", err);
    return [];
  }
}

// ============================================================
// BESTSELLERS
// ============================================================

export async function getTopSellingProducts(
  category: string,
  maxResults: number = 10
): Promise<AmazonProduct[]> {
  try {
    const params = new URLSearchParams({ category, max: String(maxResults) });
    const res = await fetch(`${API_BASE}/bestsellers?${params}`);
    if (!res.ok) throw new Error(`Bestsellers API ${res.status}`);

    const data = await res.json();
    return data.products ?? [];
  } catch (err) {
    console.error("getTopSellingProducts error:", err);
    return [];
  }
}

// ============================================================
// PRODUCT DETAILS + REVIEWS
// ============================================================

export async function getProductDetails(
  asin: string
): Promise<Partial<AmazonProduct>> {
  try {
    const res = await fetch(`${API_BASE}/product?asin=${asin}`);
    if (!res.ok) throw new Error(`Product API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getProductDetails error:", err);
    return { asin };
  }
}

// ============================================================
// ENRICH — fetch details + reviews for top N products
// ============================================================

export async function enrichProducts(
  products: AmazonProduct[],
  topN: number = 5
): Promise<AmazonProduct[]> {
  const toEnrich = products.slice(0, topN);
  const rest = products.slice(topN);

  const enriched = await Promise.all(
    toEnrich.map(async (p) => {
      try {
        const details = await getProductDetails(p.asin);
        return mergeProduct(p, details);
      } catch {
        return p;
      }
    })
  );

  return [...enriched, ...rest];
}

function mergeProduct(
  base: AmazonProduct,
  details: Partial<AmazonProduct>
): AmazonProduct {
  return {
    ...base,
    title: details.title || base.title,
    price: details.price ?? base.price,
    originalPrice: details.originalPrice ?? base.originalPrice,
    rating: details.rating ?? base.rating,
    reviewCount: details.reviewCount ?? base.reviewCount,
    imageUrl: details.images?.[0] || details.imageUrl || base.imageUrl,
    images: details.images?.length ? details.images : base.images,
    brand: details.brand || base.brand,
    features: details.features?.length ? details.features : base.features,
    description: details.description || base.description,
    reviews: details.reviews?.length ? details.reviews : base.reviews,
    availability: details.availability ?? base.availability,
    soldBy: details.soldBy ?? base.soldBy,
    isPrime: details.isPrime ?? base.isPrime,
  };
}

// ============================================================
// FALLBACK MOCK DATA — only used if API routes fail entirely
// ============================================================

export function generateMockProducts(
  query: string,
  category: string,
  count: number = 10
): AmazonProduct[] {
  const seeds: {
    asin: string;
    title: string;
    brand: string;
    price: number;
    originalPrice: number;
    rating: number;
    reviewCount: number;
    img: string;
  }[] = [
    {
      asin: "B0BSHF7WHV",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      brand: "Sony",
      price: 279.99,
      originalPrice: 399.99,
      rating: 4.7,
      reviewCount: 28456,
      img: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
    },
    {
      asin: "B0C4BVZFDP",
      title: "Apple AirPods Pro (2nd Generation)",
      brand: "Apple",
      price: 189.99,
      originalPrice: 249.99,
      rating: 4.8,
      reviewCount: 65234,
      img: "https://m.media-amazon.com/images/I/71ppWfuBhNL._AC_SL1500_.jpg",
    },
    {
      asin: "B09XS7JWHH",
      title: "Samsung 65-Inch QLED 4K Smart TV",
      brand: "Samsung",
      price: 847.99,
      originalPrice: 1299.99,
      rating: 4.5,
      reviewCount: 12389,
      img: "https://m.media-amazon.com/images/I/51Zymoq7UnL._AC_SL1000_.jpg",
    },
    {
      asin: "B0C1J1RQHX",
      title: "Bose QuietComfort 45 Bluetooth Headphones",
      brand: "Bose",
      price: 229.99,
      originalPrice: 329.99,
      rating: 4.6,
      reviewCount: 19876,
      img: "https://m.media-amazon.com/images/I/618J6sEbEOL._AC_SL1500_.jpg",
    },
    {
      asin: "B0D3J9TLTR",
      title: `Premium ${query} – Top Rated`,
      brand: "TechPro",
      price: 129.99,
      originalPrice: 179.99,
      rating: 4.6,
      reviewCount: 12345,
      img: "https://m.media-amazon.com/images/I/71mPuCCQK3L._AC_SL1500_.jpg",
    },
    {
      asin: "B0CPZPXN8Y",
      title: `Best Seller ${query} – Professional Grade`,
      brand: "ProBrand",
      price: 89.99,
      originalPrice: 129.99,
      rating: 4.7,
      reviewCount: 8765,
      img: "https://m.media-amazon.com/images/I/71fxjQxnqQL._AC_SL1500_.jpg",
    },
    {
      asin: "B0CLPD96MX",
      title: `${query} Ultra Edition – Amazon's Choice`,
      brand: "EliteBrand",
      price: 199.99,
      originalPrice: 299.99,
      rating: 4.8,
      reviewCount: 5678,
      img: "https://m.media-amazon.com/images/I/61vFpiRYe6L._AC_SL1500_.jpg",
    },
    {
      asin: "B0BN9H9VXG",
      title: `Economy ${query} – Best Value`,
      brand: "ValuePick",
      price: 24.99,
      originalPrice: 39.99,
      rating: 4.3,
      reviewCount: 23456,
      img: "https://m.media-amazon.com/images/I/71LJJrKbezL._AC_SL1500_.jpg",
    },
    {
      asin: "B09WDSL7MF",
      title: `${query} Pro Max – Customer Favorite`,
      brand: "MaxBrand",
      price: 349.99,
      originalPrice: 499.99,
      rating: 4.9,
      reviewCount: 3421,
      img: "https://m.media-amazon.com/images/I/71Swqqe7XAL._AC_SL1500_.jpg",
    },
    {
      asin: "B0C2H5F5CH",
      title: `${query} Standard Edition – Reliable Choice`,
      brand: "ReliaBrand",
      price: 59.99,
      originalPrice: 79.99,
      rating: 4.4,
      reviewCount: 7890,
      img: "https://m.media-amazon.com/images/I/61CGHv6kmLL._AC_SL1500_.jpg",
    },
  ];

  return seeds.slice(0, count).map((s, i) => ({
    asin: s.asin,
    title: s.title,
    price: s.price,
    originalPrice: s.originalPrice,
    rating: s.rating,
    reviewCount: s.reviewCount,
    imageUrl: s.img,
    images: [s.img],
    productUrl: `https://www.amazon.com/dp/${s.asin}`,
    category,
    brand: s.brand,
    isPrime: Math.random() > 0.3,
    discount: Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100),
    rank: i + 1,
    features: [
      "High quality construction",
      "Excellent customer satisfaction",
      "Fast and reliable performance",
      "Easy setup and use",
    ],
    description: `Top-rated ${query} with outstanding reviews and competitive pricing.`,
    reviews: [],
    availability: "In Stock",
    soldBy: s.brand,
  }));
}
