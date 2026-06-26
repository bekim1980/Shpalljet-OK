import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Vertical } from "@/contexts/VerticalContext";
import { formatPrice, type CurrencyCode } from "@/lib/currency";
import ThumbImage from "@/components/common/ThumbImage";
import { Skeleton } from "@/components/ui/skeleton";

const verticalKeys: Vertical[] = ["luxe", "market", "rent", "services"];

const TrendingSection = () => {
  const { t } = useTranslation();

  const { data: trending, isLoading } = useQuery({
    queryKey: ["trending-preview"],
    queryFn: async () => {
      const results: Record<string, any[]> = {};

      await Promise.all(
        verticalKeys.map(async (v) => {
          const { data } = await supabase
            .from("products")
            .select("id, title, price, image_urls, vertical, currency")
            .eq("status", "active")
            .eq("vertical", v)
            .order("created_at", { ascending: false })
            .limit(3);
          results[v] = data ?? [];
        }),
      );

      return results;
    },
  });

  const hasAny = trending && Object.values(trending).some((arr) => arr.length > 0);

  if (isLoading) {
    return (
      <section className="border-t border-border/30 bg-background py-10 sm:py-14">
        <div className="container">
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!hasAny) return null;

  return (
    <section className="border-t border-border/30 bg-background py-10 sm:py-14">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex items-center gap-2 sm:mb-8"
        >
          <TrendingUp className="h-5 w-5 text-[hsl(var(--gold))]" />
          <h2 className="font-display text-lg font-bold sm:text-xl">{t("homepage.trending")}</h2>
        </motion.div>

        <div className="space-y-8">
          {verticalKeys.map(
            (v) =>
              trending?.[v]?.length > 0 && (
                <motion.div
                  key={v}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t(`homepage.verticals.${v}.label`)}
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {trending[v].map((item: any) => (
                      <Link key={item.id} to={`/product/${item.id}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/40 bg-muted transition-[border-color,transform] duration-300 group-hover:border-[hsl(var(--gold)/0.25)] group-active:scale-[0.98]">
                          <ThumbImage
                            src={item.image_urls?.[0] ?? null}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </div>
                        <p className="mt-1.5 truncate text-[11px] font-medium text-foreground sm:text-xs">{item.title}</p>
                        <p className="text-[11px] font-semibold text-[hsl(var(--gold-light))] sm:text-xs">
                          {formatPrice(Number(item.price), (item.currency || "EUR") as CurrencyCode)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ),
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
