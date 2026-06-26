import { useState, useRef } from "react";
import { Heart, MapPin, ChevronLeft, ChevronRight, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice, type CurrencyCode } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { computeBadges } from "@/lib/productBadges";
import { track } from "@/lib/analytics";
import ThumbImage from "@/components/common/ThumbImage";

interface ProductCardProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  image_urls?: string[];
  seller: { name: string; avatar: string; rating?: number };
  category: string;
  description: string;
  condition: string;
  currency?: string;
  country?: string | null;
  city?: string | null;
  views_count?: number | null;
  messages_count?: number | null;
  is_boosted?: boolean | null;
  boost_expires_at?: string | null;
  created_at?: string | null;
  price_history?: unknown;
}

const ProductCard = ({ product, index }: { product: ProductCardProduct; index: number }) => {
  const { user } = useAuth();
  const { data: wishlist } = useWishlist();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const navigate = useNavigate();
  const { currency: defaultCurrency } = useLocale();
  const { t } = useTranslation();
  const [activeImg, setActiveImg] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isWished = wishlist?.has(product.id) ?? false;
  const productCurrency = (product.currency as CurrencyCode) || defaultCurrency;

  const images = (product.image_urls?.length ? product.image_urls : product.image ? [product.image] : []).slice(0, 5);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }
    toggleWishlist({ productId: product.id, isWished });
  };

  const scrollTo = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(0, Math.min(idx, images.length - 1));
    setActiveImg(next);
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const itemWidth = el.clientWidth;
    const newIdx = Math.round(scrollLeft / itemWidth);
    if (newIdx !== activeImg) setActiveImg(newIdx);
  };

  const locationText = [product.city, product.country].filter(Boolean).join(", ");
  const badges = computeBadges(product);
  const views = product.views_count ?? 0;
  const messages = product.messages_count ?? 0;
  const isBoostedActive =
    !!product.is_boosted && !!product.boost_expires_at && new Date(product.boost_expires_at).getTime() > Date.now();
  const createdAtMs = product.created_at ? new Date(product.created_at).getTime() : 0;
  const isNewToday = createdAtMs > 0 && Date.now() - createdAtMs < 24 * 60 * 60 * 1000;
  const timeAgo = createdAtMs > 0 ? formatDistanceToNow(new Date(createdAtMs), { addSuffix: true }) : "";

  let dynamicInfo: { Icon: typeof MessageCircle; text: string; tone: string } | null = null;
  if (messages > 0) {
    dynamicInfo = {
      Icon: MessageCircle,
      text: t(messages === 1 ? "productCard.contacted_one" : "productCard.contacted_other", { count: messages }),
      tone: "text-emerald-400/90",
    };
  } else if (views >= 25) {
    dynamicInfo = {
      Icon: TrendingUp,
      text: t("productCard.viewed", { count: views }),
      tone: "text-muted-foreground",
    };
  } else if (isNewToday) {
    dynamicInfo = {
      Icon: Sparkles,
      text: t("productCard.newToday"),
      tone: "text-sky-400/90",
    };
  }

  const handleClickTrack = () => {
    track("card_click", {
      dedupeKey: product.id,
      props: { id: product.id, position: index, boosted: isBoostedActive },
    });
    supabase.from("product_views").insert({ product_id: product.id, viewer_id: user?.id ?? null } as any).then(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Link
        to={`/product/${product.id}`}
        onClick={handleClickTrack}
        data-testid={`product-card-${product.id}`}
        className="group block overflow-hidden rounded-xl border border-border/45 bg-card/70 transition-[border-color,box-shadow,transform] duration-300 hover:border-[hsl(var(--gold)/0.3)] hover:shadow-gold active:scale-[0.99]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary/40">
          {images.length > 0 ? (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {images.map((url, i) => (
                  <div key={i} className="relative h-full w-full flex-shrink-0 snap-center">
                    <ThumbImage
                      src={url}
                      alt={`${product.title} ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <>
                  {activeImg > 0 && (
                    <button
                      onClick={(e) => scrollTo(activeImg - 1, e)}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-background/75 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {activeImg < images.length - 1 && (
                    <button
                      onClick={(e) => scrollTo(activeImg + 1, e)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-background/75 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => scrollTo(i, e)}
                        className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-3 bg-[hsl(var(--gold))]" : "w-1.5 bg-foreground/35"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/50 to-secondary/20">
              <span className="font-display text-lg uppercase tracking-wider text-muted-foreground/25">{product.category}</span>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 z-10">
            <button
              onClick={handleWishlist}
              aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWished}
              data-testid={`wishlist-toggle-${product.id}`}
              data-state={isWished ? "active" : "inactive"}
              className="rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <Heart className={`h-4 w-4 transition-colors ${isWished ? "fill-primary text-primary" : "text-foreground/70"}`} />
            </button>
          </div>

          {product.condition && (
            <div className="absolute right-2.5 top-2.5 z-10">
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium capitalize text-foreground/70 backdrop-blur-sm">
                {product.condition}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-3.5 sm:p-4">
          {badges.length > 0 && (
            <div className="-mt-0.5 flex flex-wrap gap-1">
              {badges.slice(0, 3).map((b) => (
                <span
                  key={b.key}
                  data-testid={`badge-${b.key}`}
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${b.className}`}
                >
                  {b.emoji && <span aria-hidden>{b.emoji}</span>}
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          )}

          <p className="text-lg font-bold leading-none tracking-tight text-[hsl(var(--gold-light))]">
            {formatPrice(product.price, productCurrency)}
          </p>

          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
            {product.title}
          </h3>

          {dynamicInfo && (
            <div
              data-testid={`dynamic-info-${product.id}`}
              className={`flex items-center gap-1 text-[11px] ${dynamicInfo.tone}`}
            >
              <dynamicInfo.Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{dynamicInfo.text}</span>
            </div>
          )}

          {(locationText || timeAgo) && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {locationText && <MapPin className="h-3 w-3 shrink-0 opacity-70" />}
              <span className="truncate">
                {locationText}
                {locationText && timeAgo && <span className="mx-1 opacity-50">·</span>}
                {timeAgo}
              </span>
            </div>
          )}

          {isBoostedActive && (
            <p className="text-[10px] italic text-muted-foreground/70">{t("productCard.boosted")}</p>
          )}

          <div className="flex items-center gap-2 border-t border-border/30 pt-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
              {product.seller.avatar ? (
                <img src={product.seller.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                product.seller.name.charAt(0)
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">{product.seller.name}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
