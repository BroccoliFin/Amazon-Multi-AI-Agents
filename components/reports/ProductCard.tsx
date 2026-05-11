"use client";

import { useState } from "react";
import Image from "next/image";
import { AmazonProduct, ProductReview } from "@/types";
import { formatPrice, formatNumber, cn } from "@/lib/utils";
import {
  Star,
  ExternalLink,
  Award,
  Zap,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: AmazonProduct;
  rank?: number;
  isRecommended?: boolean;
  score?: number;
  index?: number;
}

export function ProductCard({
  product,
  rank,
  isRecommended,
  score,
  index = 0,
}: ProductCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  const discount =
    product.discount ??
    (product.originalPrice && product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : null);

  // Deduplicated image list
  const allImages = [
    ...new Set(
      [...(product.images ?? []), product.imageUrl].filter(Boolean)
    ),
  ] as string[];

  const currentImg = allImages[imgIdx] || "";
  const hasMultipleImages = allImages.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative rounded-xl border bg-white",
        "transition-all duration-300 hover:border-slate-300 hover:shadow-md",
        isRecommended
          ? "border-indigo-200 shadow-sm shadow-indigo-100"
          : "border-slate-200 shadow-sm"
      )}
    >
      {/* Top Pick badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-4 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30">
            <Award className="h-3 w-3" />
            Top Pick
          </div>
        </div>
      )}

      <div className="flex gap-4 p-4">
        {/* ── Image block ── */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
          {rank && (
            <div className="absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white shadow-sm">
              {rank}
            </div>
          )}

          {currentImg && !imgError ? (
            <Image
              src={currentImg}
              alt={product.title}
              fill
              className="object-contain p-1"
              sizes="112px"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
          )}

          {/* Arrow navigation */}
          {hasMultipleImages && !imgError && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImgIdx((i) => (i - 1 + allImages.length) % allImages.length);
                }}
                className="absolute left-0.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImgIdx((i) => (i + 1) % allImages.length);
                }}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                {allImages.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIdx(i);
                    }}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === imgIdx ? "w-3 bg-white" : "w-1 bg-white/40"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">
              {product.title}
            </h3>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View on Amazon"
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {product.brand && (
            <p className="mt-0.5 text-xs text-slate-400">
              by <span className="font-medium text-slate-300">{product.brand}</span>
            </p>
          )}

          {/* Rating + Prime + Availability */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {product.rating !== null && (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3 w-3",
                        s <= Math.round(product.rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-600 text-slate-600"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-amber-400">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviewCount !== null && (
                  <span className="text-xs text-slate-500">
                    ({formatNumber(product.reviewCount)})
                  </span>
                )}
              </div>
            )}
            {product.isPrime && (
              <Badge variant="info" size="sm">
                <Zap className="mr-1 h-2.5 w-2.5" />
                Prime
              </Badge>
            )}
            {product.availability && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Package className="h-3 w-3" />
                {product.availability}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold text-slate-800">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice &&
              product.originalPrice > (product.price ?? 0) && (
                <span className="text-sm text-slate-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            {discount && discount > 0 && (
              <Badge variant="success" size="sm">
                <Tag className="mr-1 h-2.5 w-2.5" />
                -{discount}%
              </Badge>
            )}
            {score !== undefined && (
              <div className="ml-auto flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5">
                <span className="text-xs font-bold text-indigo-400">
                  {score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/10</span>
              </div>
            )}
          </div>

          {product.soldBy && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Store className="h-3 w-3" />
              Sold by <span className="text-slate-400">{product.soldBy}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Feature pills ── */}
      {product.features.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {product.features.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 border border-slate-200"
              >
                <CheckCircle className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
                {f.length > 48 ? f.slice(0, 48) + "…" : f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Expand toggle ── */}
      {(product.description ||
        product.features.length > 3 ||
        product.reviews.length > 0 ||
        allImages.length > 1) && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-3">
              {product.reviews.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  {product.reviews.length} customer reviews
                </span>
              )}
              {allImages.length > 1 && (
                <span className="text-slate-500">
                  {allImages.length} images
                </span>
              )}
              {product.features.length > 3 && (
                <span className="text-slate-500">
                  {product.features.length} features
                </span>
              )}
            </span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 px-4 pb-4">
                  {/* Description */}
                  {product.description && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-600">
                        Product Description
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Extra features */}
                  {product.features.length > 3 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-600">
                        All Features
                      </p>
                      <ul className="space-y-1">
                        {product.features.map((f, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-slate-500"
                          >
                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Image gallery thumbnails */}
                  {allImages.length > 1 && !imgError && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-300">
                        Product Images
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allImages.slice(0, 8).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className={cn(
                              "relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all",
                              i === imgIdx
                                ? "border-indigo-500"
                                : "border-slate-600 hover:border-slate-400"
                            )}
                          >
                            <Image
                              src={img}
                              alt={`${product.title} view ${i + 1}`}
                              fill
                              className="object-contain p-0.5"
                              sizes="56px"
                              onError={() => {}}
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Reviews */}
                  {product.reviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                        Customer Reviews
                      </p>
                      <div className="space-y-3">
                        {product.reviews.map((review, i) => (
                          <ReviewCard key={i} review={review} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Review Card ──────────────────────────────────────────────

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 leading-snug">
            {review.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-2.5 w-2.5",
                    s <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-600 text-slate-600"
                  )}
                />
              ))}
            </div>
            {review.verified && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Verified Purchase
              </span>
            )}
            <span className="text-xs text-slate-500">{review.date}</span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
          {review.author}
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed line-clamp-5">
        {review.body}
      </p>

      {review.helpful > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
          <ThumbsUp className="h-3 w-3" />
          {review.helpful} {review.helpful === 1 ? "person" : "people"} found this helpful
        </p>
      )}
    </div>
  );
}
