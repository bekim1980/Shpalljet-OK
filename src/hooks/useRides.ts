import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RideDriver {
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
  phone_number: string | null;
}

export interface Ride {
  id: string;
  user_id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  price: number | null;
  seats_total: number;
  seats_available: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  driver_name?: string | null;
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from("rides")
      .select("*")
      .eq("status", "active")
      .gte("departure_time", nowIso)
      .order("departure_time", { ascending: true });

    if (error) {
      console.error("Error fetching rides:", error);
      setLoading(false);
      return;
    }

    const list = (data || []) as Ride[];
    // enrich with driver names
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      list.forEach((r) => (r.driver_name = map.get(r.user_id) ?? null));
    }
    setRides(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRides();
    const channel = supabase
      .channel("rides-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => {
        fetchRides();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRides]);

  return { rides, loading, refetch: fetchRides };
}

export function useRide(id: string | undefined) {
  const { ride, loading } = useRideDetail(id);
  return { ride, loading };
}

export function useRideDetail(id: string | undefined) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<RideDriver | null>(null);
  const [driverRideCount, setDriverRideCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).from("rides").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error) console.error(error);
      if (!data) {
        setRide(null);
        setDriver(null);
        setDriverRideCount(0);
        setLoading(false);
        return;
      }

      const [profileRes, countRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url, created_at, bio, phone_number")
          .eq("user_id", data.user_id)
          .maybeSingle(),
        (supabase as any)
          .from("rides")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user_id)
          .eq("status", "active"),
      ]);

      if (cancelled) return;
      setRide({ ...data, driver_name: profileRes.data?.display_name ?? null });
      setDriver(profileRes.data ?? null);
      setDriverRideCount(countRes.count ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { ride, driver, driverRideCount, loading };
}

export function useSimilarRides(ride: Ride | null | undefined) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ride) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("rides")
        .select("*")
        .eq("status", "active")
        .neq("id", ride.id)
        .gte("departure_time", nowIso)
        .order("departure_time", { ascending: true })
        .limit(24);

      if (cancelled) return;
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const from = ride.from_city.toLowerCase();
      const to = ride.to_city.toLowerCase();
      const scored = (data || [])
        .map((r: Ride) => {
          const rf = r.from_city.toLowerCase();
          const rt = r.to_city.toLowerCase();
          let score = 0;
          if (rf.includes(from) && rt.includes(to)) score += 3;
          else if (rf.includes(from) || rt.includes(to)) score += 1;
          return { r, score };
        })
        .filter((x: { score: number }) => x.score > 0)
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, 6)
        .map((x: { r: Ride }) => x.r);

      const ids = Array.from(new Set(scored.map((r: Ride) => r.user_id))) as string[];
      let enriched = scored;
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        const map = new Map((profiles || []).map((p: { user_id: string; display_name: string | null }) => [p.user_id, p.display_name]));
        enriched = scored.map((r: Ride) => ({ ...r, driver_name: map.get(r.user_id) ?? null }));
      }

      setRides(enriched);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ride?.id, ride?.from_city, ride?.to_city]);

  return { rides, loading };
}

export interface CreateRideInput {
  from_city: string;
  to_city: string;
  departure_time: string;
  price: number | null;
  seats_total: number;
  seats_available: number;
  notes?: string | null;
}

export function useCreateRide() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const createRide = async (input: CreateRideInput) => {
    if (!user) return { error: new Error("Not authenticated") };
    setSubmitting(true);
    const { data, error } = await (supabase as any)
      .from("rides")
      .insert({ ...input, user_id: user.id })
      .select("id")
      .single();
    setSubmitting(false);
    return { data, error };
  };

  return { createRide, submitting };
}
