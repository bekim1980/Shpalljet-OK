import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Vertical } from "@/contexts/VerticalContext";

export interface ProductWithSeller {
  id: string;
  title: string;
  price: number;
  image_urls: string[];
  seller_id: string;
  user_id?: string | null;
  category: string;
  description: string;
  condition: string;
  status: string;
  vertical: string;
  created_at: string;
  currency: string;
  country: string | null;
  city: string | null;
  contact_method: string;
  listing_type: string;
  is_boosted: boolean;
  boost_expires_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  seller?: {
    id?: string;
    full_name?: string | null;
    display_name: string | null;
    avatar_url: string | null;
    phone_number?: string | null;
    whatsapp_enabled?: boolean;
    viber_enabled?: boolean;
  };
}

export const useProducts = (vertical?: Vertical) => {
  return useQuery({
    queryKey: ["products", vertical],
    queryFn: async (): Promise<ProductWithSeller[]> => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (vertical) {
        query = query.eq("vertical", vertical);
      }

      const { data: products, error } = await query;

      if (error) throw error;
      if (!products || products.length === 0) return [];

      const sellerIds = [
        ...new Set(
          products
            .map((p) => p.seller_id || p.user_id)
            .filter(Boolean)
        ),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", sellerIds);

      const profileMap = new Map(
        profiles?.map((p) => [
          p.id,
          {
            id: p.id,
            full_name: p.full_name,
            display_name: p.full_name,
            avatar_url: p.avatar_url,
          },
        ]) ?? []
      );

      return products.map((p) => ({
        ...p,
        seller: profileMap.get(p.seller_id || p.user_id) ?? undefined,
      }));
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async (): Promise<ProductWithSeller | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return null;

      const sellerId = data.seller_id || data.user_id;

      let seller = undefined;

      if (sellerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", sellerId)
          .maybeSingle();

        if (profile) {
          seller = {
            id: profile.id,
            full_name: profile.full_name,
            display_name: profile.full_name,
            avatar_url: profile.avatar_url,
          };
        }
      }

      return { ...data, seller };
    },
  });
};

export const categories = [
  "All",
  "Watches",
  "Bags",
  "Books",
  "Audio",
  "Photography",
  "Furniture",
  "Art",
  "Jewelry",
  "Other",
];

export const categoryLabels: Record<string, string> = {
  All: "Të Gjitha",
  Watches: "Orë",
  Bags: "Çanta",
  Books: "Libra",
  Audio: "Audio",
  Photography: "Fotografi",
  Furniture: "Mobilje",
  Art: "Art",
  Jewelry: "Bizhuteri",
  Other: "Tjetër",
};
