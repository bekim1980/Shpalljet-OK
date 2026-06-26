import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, DollarSign, Tag, FileText, MapPin, Crown, Store, Home, Briefcase, BriefcaseBusiness,
  Package, MessageSquare, Phone, Send, Clock, Sparkles, Mail, Link as LinkIcon, Building2, Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { SUPPORTED_CURRENCIES, COUNTRIES } from "@/lib/currency";
import Header from "@/components/Header";
import ImageUploader from "@/components/ImageUploader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VERTICALS, type Vertical } from "@/contexts/VerticalContext";
import { VERTICAL_CATEGORIES, CONDITIONS, PRICE_PERIODS, CONTACT_METHODS, JOB_TYPES, EXPERIENCE_LEVELS } from "@/data/verticalConfig";
import { useDraftListing } from "@/hooks/useDraftListing";
import { useCategories } from "@/hooks/useCategories";
import SmartListingHelper, { type ListingSuggestion } from "@/components/ai/SmartListingHelper";
import { ENABLE_AI_ASSISTANT } from "@/config/features";
import { useCreateRide } from "@/hooks/useRides";

type SellSection = Vertical | "rides";

const verticalIcons: Record<Vertical, React.ElementType> = { luxe: Crown, market: Store, rent: Home, services: Briefcase, jobs: BriefcaseBusiness };

const PRODUCT_SECTIONS: { value: Vertical; label: string }[] = VERTICALS.map((v) => ({
  value: v.value,
  label: v.label,
}));
const contactIcons: Record<string, React.ElementType> = { chat: MessageSquare, phone: Phone, whatsapp: Send, viber: Phone };

const compressImage = (file: File, maxDim: number, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => { if (b) resolve(b); else reject(new Error("Compression failed")); },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });

const Sell = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency: defaultCurrency } = useLocale();
  const { draft, updateDraft, clearDraft } = useDraftListing();
  const queryClient = useQueryClient();
  const { data: dbCategories } = useCategories();

  const { createRide, submitting: rideSubmitting } = useCreateRide();

  const [sellSection, setSellSection] = useState<SellSection | null>(() => draft.selectedVertical);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rideFrom, setRideFrom] = useState("");
  const [rideTo, setRideTo] = useState("");
  const [rideDeparture, setRideDeparture] = useState("");
  const [ridePrice, setRidePrice] = useState("");
  const [rideSeatsTotal, setRideSeatsTotal] = useState("3");
  const [rideSeatsAvailable, setRideSeatsAvailable] = useState("3");
  const [rideNotes, setRideNotes] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isRides = sellSection === "rides";
  const isBusy = submitting || rideSubmitting;

  const handleImagesChange = (newImages: File[], newPreviews: string[]) => { setImages(newImages); setPreviews(newPreviews); };

  const selectSection = (next: SellSection) => {
    if (sellSection && sellSection !== next) {
      const hasProductDraft = draft.title || draft.category || images.length > 0;
      const hasRideDraft = rideFrom || rideTo || rideDeparture;
      if ((hasProductDraft || hasRideDraft) && !window.confirm(t("sell.switchSectionConfirm"))) return;
    }
    if (next === "rides") {
      setSellSection("rides");
      updateDraft({ selectedVertical: null, category: "", condition: "" });
    } else {
      setSellSection(next);
      updateDraft({ selectedVertical: next, category: "", condition: "" });
    }
    setErrors({});
  };

  const validateRide = (): boolean => {
    const errs: Record<string, string> = {};
    if (!sellSection) errs.vertical = t("sell.selectSection");
    if (!rideFrom.trim()) errs.rideFrom = t("rides.errorRequired", "Nga, për dhe nisja janë të detyrueshme");
    if (!rideTo.trim()) errs.rideTo = t("rides.errorRequired", "Nga, për dhe nisja janë të detyrueshme");
    if (!rideDeparture) errs.rideDeparture = t("rides.errorRequired", "Nga, për dhe nisja janë të detyrueshme");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!sellSection || sellSection === "rides") {
      if (!sellSection) errs.vertical = t("sell.selectSection");
      setErrors(errs);
      return false;
    }
    if (!draft.selectedVertical) errs.vertical = t("sell.selectSection");
    if (!draft.title.trim()) errs.title = t("sell.titleRequired");
    if (!draft.category) errs.category = t("sell.selectCategory");
    if (draft.selectedVertical !== "jobs" && images.length === 0) {
      errs.images = t("sell.imageRequired", "Please add at least one image");
    }
    if (draft.selectedVertical === "luxe" || draft.selectedVertical === "market") {
      if (!draft.price) errs.price = t("sell.setPrice");
      if (!draft.condition) errs.condition = t("sell.selectCondition");
    }
    if (draft.selectedVertical === "rent") { if (!draft.price) errs.price = t("sell.setPrice"); }
    if (draft.selectedVertical === "jobs") {
      if (!draft.companyName.trim()) errs.companyName = t("sell.companyRequired", "Company name is required");
      if (!draft.jobType) errs.jobType = t("sell.jobTypeRequired", "Select job type");
      if (!draft.applicationEmail.trim() && !draft.applicationUrl.trim()) {
        errs.applicationEmail = t("sell.applicationRequired", "Provide an application email or URL");
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRide()) { toast.error(t("sell.fillRequired")); return; }
    const sTotal = Math.max(1, parseInt(rideSeatsTotal || "1", 10));
    const sAvail = Math.min(sTotal, Math.max(0, parseInt(rideSeatsAvailable || "0", 10)));
    const { data, error } = await createRide({
      from_city: rideFrom.trim(),
      to_city: rideTo.trim(),
      departure_time: new Date(rideDeparture).toISOString(),
      price: ridePrice ? Number(ridePrice) : null,
      seats_total: sTotal,
      seats_available: sAvail,
      notes: rideNotes.trim() || null,
    });
    if (error) {
      toast.error(error.message || t("sell.listingFailed"));
      return;
    }
    toast.success(t("rides.created", "Udhëtimi u publikua"));
    navigate(`/rides/${data?.id ?? ""}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRides) {
      await handleRideSubmit(e);
      return;
    }
    if (!validate()) { toast.error(t("sell.fillRequired")); return; }
    if (!user) return;
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of images) {
        try {
          const compressed = await compressImage(file, 1920, 0.8);
          const path = `${user.id}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage.from("product-images").upload(path, compressed, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        } catch (imgErr: any) {
          console.error("Image upload failed:", imgErr);
          toast.error(t("sell.imageUploadFailed", "Ngarkimi i fotos dështoi: ") + (imgErr.message || ""));
          setSubmitting(false);
          return;
        }
      }
      // Calculate expires_at based on listing type
      const now = new Date();
      const daysToAdd = draft.listingType === "paid" ? 30 : 7;
      const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

      const insertData: any = {
        seller_id: user.id, title: draft.title.trim(), description: draft.description.trim(),
        price: parseFloat(draft.price) || 0, category: draft.category, category_id: draft.categoryId || null,
        vertical: draft.selectedVertical, image_urls: imageUrls, location: draft.location.trim() || null,
        contact_method: draft.contactMethod, currency: draft.currency || defaultCurrency,
        country: draft.country || null, city: draft.city || null,
        listing_type: draft.listingType, expires_at: expiresAt,
      };
      if (draft.selectedVertical === "luxe" || draft.selectedVertical === "market") {
        insertData.condition = draft.condition;
        if (draft.selectedVertical === "luxe") insertData.brand = draft.brand.trim() || null;
      }
      if (draft.selectedVertical === "rent") { insertData.price_period = draft.pricePeriod; insertData.rental_period = draft.pricePeriod; insertData.availability = draft.availability.trim() || null; }
      if (draft.selectedVertical === "services") { insertData.price_period = draft.pricePeriod; insertData.service_category = draft.category; insertData.provider_profile = draft.providerProfile.trim() || null; insertData.service_area = draft.serviceArea.trim() || null; }
      if (draft.selectedVertical === "jobs") {
        insertData.company_name = draft.companyName.trim();
        insertData.job_type = draft.jobType;
        insertData.salary_min = draft.salaryMin ? parseFloat(draft.salaryMin) : null;
        insertData.salary_max = draft.salaryMax ? parseFloat(draft.salaryMax) : null;
        insertData.job_location = draft.jobLocation.trim() || null;
        insertData.experience_level = draft.experienceLevel || null;
        insertData.application_email = draft.applicationEmail.trim() || null;
        insertData.application_url = draft.applicationUrl.trim() || null;
        // Jobs don't need a price; ensure non-null
        insertData.price = insertData.price || 0;
        // Skip strict condition for jobs
        insertData.condition = "used";
      }
      if (draft.selectedVertical === "luxe") { insertData.moderation_status = "pending"; insertData.status = "pending"; }
      const { error } = await supabase.from("products").insert(insertData);
      if (error) throw error;
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["trending-preview"] });
      if (draft.selectedVertical === "luxe") { toast.success(t("sell.pendingModeration")); } else { toast.success(t("sell.listingSuccess")); }
      navigate("/profile");
    } catch (err: any) { toast.error(err.message || t("sell.listingFailed")); } finally { setSubmitting(false); }
  };

  const v = draft.selectedVertical;
  const categories = v ? VERTICAL_CATEGORIES[v] : [];
  const FieldError = ({ field }: { field: string }) => errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <div className="container max-w-lg py-5 sm:py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold mb-1">{t("sell.title")}</h1>
          <p className="text-muted-foreground text-sm mb-5 sm:mb-6">
            {isRides ? t("sell.ridesSubtitle") : t("sell.subtitle")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 min-w-0">
            {/* Section picker */}
            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">{t("sell.section")} *</Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 min-w-0">
                {PRODUCT_SECTIONS.map((sect) => {
                  const Icon = verticalIcons[sect.value];
                  const selected = sellSection === sect.value;
                  return (
                    <button
                      key={sect.value}
                      type="button"
                      onClick={() => selectSection(sect.value)}
                      className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all min-w-0 active:scale-[0.98] ${
                        selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[10px] sm:text-[11px] font-display font-bold block leading-tight truncate ${selected ? "text-primary" : "text-foreground"}`}>
                        {sect.label}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => selectSection("rides")}
                  className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all min-w-0 active:scale-[0.98] ${
                    isRides
                      ? "border-sky-400/60 bg-sky-500/15 ring-1 ring-sky-400/50"
                      : "border-border bg-card hover:border-sky-400/40"
                  }`}
                >
                  <Car className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${isRides ? "text-sky-300" : "text-muted-foreground"}`} />
                  <span className={`text-[9px] sm:text-[10px] font-display font-bold block leading-tight ${isRides ? "text-sky-200" : "text-foreground"}`}>
                    {t("homepage.verticals.rides.label", "RIDES / UDHËTIME")}
                  </span>
                </button>
              </div>
              <FieldError field="vertical" />
            </div>

            {isRides && (
              <p className="text-xs text-muted-foreground bg-sky-500/10 border border-sky-400/20 rounded-lg px-3 py-2">
                {t("sell.ridesHint")}
              </p>
            )}

            {isRides ? (
              <div className="space-y-4 rounded-xl border border-border bg-card/50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rideFrom">{t("rides.from", "Nga")} *</Label>
                    <Input id="rideFrom" value={rideFrom} onChange={(e) => setRideFrom(e.target.value)} placeholder="Prishtinë" className="bg-secondary/50 h-11" />
                    <FieldError field="rideFrom" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rideTo">{t("rides.to", "Për")} *</Label>
                    <Input id="rideTo" value={rideTo} onChange={(e) => setRideTo(e.target.value)} placeholder="Tiranë" className="bg-secondary/50 h-11" />
                    <FieldError field="rideTo" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rideDeparture">{t("rides.departure", "Nisja")} *</Label>
                  <Input id="rideDeparture" type="datetime-local" value={rideDeparture} onChange={(e) => setRideDeparture(e.target.value)} className="bg-secondary/50 h-11" />
                  <FieldError field="rideDeparture" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ridePrice">{t("rides.price", "Çmimi")}</Label>
                    <Input id="ridePrice" type="number" min="0" step="0.01" value={ridePrice} onChange={(e) => setRidePrice(e.target.value)} placeholder="0" className="bg-secondary/50 h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rideSeatsTotal">{t("rides.seatsTotal", "Ulëse totale")}</Label>
                    <Input id="rideSeatsTotal" type="number" min="1" value={rideSeatsTotal} onChange={(e) => setRideSeatsTotal(e.target.value)} className="bg-secondary/50 h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rideSeatsAvail">{t("rides.seatsAvailable", "Ulëse të lira")}</Label>
                    <Input id="rideSeatsAvail" type="number" min="0" value={rideSeatsAvailable} onChange={(e) => setRideSeatsAvailable(e.target.value)} className="bg-secondary/50 h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rideNotes">{t("rides.notes", "Shënime")}</Label>
                  <Textarea id="rideNotes" value={rideNotes} onChange={(e) => setRideNotes(e.target.value)} placeholder={t("rides.notesPlaceholder", "Pika e takimit, bagazh, etj.") as string} className="bg-secondary/50 min-h-[88px]" />
                </div>
              </div>
            ) : (
              <>
            <ImageUploader images={images} previews={previews} onImagesChange={handleImagesChange} />
            <FieldError field="images" />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("sell.titleField")} *</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="title" placeholder={v === "services" ? t("sell.placeholders.serviceTitle") : v === "rent" ? t("sell.placeholders.rentTitle") : t("sell.placeholders.luxeTitle")} className="pl-9 bg-secondary/50" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} maxLength={100} />
              </div>
              <FieldError field="title" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("sell.description")}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea id="description" placeholder={v === "services" ? t("sell.placeholders.serviceDesc") : v === "rent" ? t("sell.placeholders.rentDesc") : t("sell.placeholders.luxeDesc")} className="pl-9 bg-secondary/50 min-h-[100px]" value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} maxLength={2000} />
              </div>
            </div>

            {ENABLE_AI_ASSISTANT && <SmartListingHelper
              title={draft.title}
              description={draft.description}
              vertical={v ?? ""}
              onApply={(s: ListingSuggestion) => {
                const patch: Partial<typeof draft> = {
                  title: s.improved_title || draft.title,
                  description: s.improved_description || draft.description,
                };
                if (s.vertical && !draft.selectedVertical) patch.selectedVertical = s.vertical;
                if (s.currency && !draft.currency) patch.currency = s.currency;
                if (!draft.price && s.suggested_price_min && s.suggested_price_max) {
                  patch.price = String(Math.round((s.suggested_price_min + s.suggested_price_max) / 2));
                }
                updateDraft(patch);
              }}
            />}
            {(v === "luxe" || v === "market" || v === "rent") && (
              <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${v === "rent" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <div className="space-y-2">
                  <Label htmlFor="price">{t("sell.price")} *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" className="pl-9 bg-secondary/50" value={draft.price} onChange={(e) => updateDraft({ price: e.target.value })} />
                  </div>
                  <FieldError field="price" />
                </div>
                <div className="space-y-2">
                  <Label>{t("sell.currency")}</Label>
                  <Select value={draft.currency || defaultCurrency} onValueChange={(val) => updateDraft({ currency: val })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {v === "rent" && (
                  <div className="space-y-2">
                    <Label>{t("sell.period")}</Label>
                    <Select value={draft.pricePeriod} onValueChange={(val) => updateDraft({ pricePeriod: val })}>
                      <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRICE_PERIODS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {v === "services" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("sell.startingPrice")}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" className="pl-9 bg-secondary/50" value={draft.price} onChange={(e) => updateDraft({ price: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("sell.currency")}</Label>
                  <Select value={draft.currency || defaultCurrency} onValueChange={(val) => updateDraft({ currency: val })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>{SUPPORTED_CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Category */}
            {v && (
              <div className="space-y-2">
                <Label>{v === "services" ? t("sell.serviceCategory") + " *" : v === "rent" ? t("sell.rentCategory") + " *" : t("sell.category") + " *"}</Label>
                <Select value={draft.category} onValueChange={(val) => { const matchedCat = dbCategories?.find(c => c.slug === val); updateDraft({ category: val, categoryId: matchedCat?.id || "", subcategory: "" }); }}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.select")} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                </Select>
                <FieldError field="category" />
              </div>
            )}

            {/* Subcategory */}
            {v && draft.category && (() => {
              const parentCat = categories.find(c => c.value === draft.category);
              const subs = parentCat?.subcategories;
              if (!subs || subs.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label>{t("sell.subcategory")}</Label>
                  <Select value={draft.subcategory || ""} onValueChange={(val) => updateDraft({ subcategory: val })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.subcategoryPlaceholder")} /></SelectTrigger>
                    <SelectContent>{subs.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              );
            })()}

            {/* Condition */}
            {(v === "luxe" || v === "market") && (
              <div className="space-y-2">
                <Label>{t("sell.condition")} *</Label>
                <Select value={draft.condition} onValueChange={(val) => updateDraft({ condition: val })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.select")} /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                </Select>
                <FieldError field="condition" />
              </div>
            )}

            {v === "luxe" && (
              <div className="space-y-2">
                <Label htmlFor="brand">{t("sell.brand")}</Label>
                <Input id="brand" placeholder={t("sell.brandPlaceholder")} className="bg-secondary/50" value={draft.brand} onChange={(e) => updateDraft({ brand: e.target.value })} />
              </div>
            )}

            {v === "rent" && (
              <div className="space-y-2">
                <Label htmlFor="availability">{t("sell.availability")}</Label>
                <Input id="availability" placeholder={t("sell.availabilityPlaceholder")} className="bg-secondary/50" value={draft.availability} onChange={(e) => updateDraft({ availability: e.target.value })} />
              </div>
            )}

            {v === "services" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="serviceArea">{t("sell.serviceArea")}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="serviceArea" placeholder={t("sell.serviceAreaPlaceholder")} className="pl-9 bg-secondary/50" value={draft.serviceArea} onChange={(e) => updateDraft({ serviceArea: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerProfile">{t("sell.providerProfile")}</Label>
                  <Textarea id="providerProfile" placeholder={t("sell.placeholders.providerDesc")} className="bg-secondary/50 min-h-[80px]" value={draft.providerProfile} onChange={(e) => updateDraft({ providerProfile: e.target.value })} maxLength={1000} />
                </div>
              </>
            )}

            {/* Jobs-specific fields */}
            {v === "jobs" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("sell.companyName", "Company name")} *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="companyName" className="pl-9 bg-secondary/50" value={draft.companyName} onChange={(e) => updateDraft({ companyName: e.target.value })} maxLength={120} />
                  </div>
                  <FieldError field="companyName" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>{t("sell.jobType", "Job type")} *</Label>
                    <Select value={draft.jobType} onValueChange={(val) => updateDraft({ jobType: val })}>
                      <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.select")} /></SelectTrigger>
                      <SelectContent>{JOB_TYPES.map((j) => (<SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>))}</SelectContent>
                    </Select>
                    <FieldError field="jobType" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sell.experienceLevel", "Experience level")}</Label>
                    <Select value={draft.experienceLevel} onValueChange={(val) => updateDraft({ experienceLevel: val })}>
                      <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.select")} /></SelectTrigger>
                      <SelectContent>{EXPERIENCE_LEVELS.map((e) => (<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin">{t("sell.salaryMin", "Salary min")}</Label>
                    <Input id="salaryMin" type="number" min="0" step="0.01" className="bg-secondary/50" value={draft.salaryMin} onChange={(e) => updateDraft({ salaryMin: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax">{t("sell.salaryMax", "Salary max")}</Label>
                    <Input id="salaryMax" type="number" min="0" step="0.01" className="bg-secondary/50" value={draft.salaryMax} onChange={(e) => updateDraft({ salaryMax: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobLocation">{t("sell.jobLocation", "Job location")}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="jobLocation" placeholder="Tirana, remote, hybrid…" className="pl-9 bg-secondary/50" value={draft.jobLocation} onChange={(e) => updateDraft({ jobLocation: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicationEmail">{t("sell.applicationEmail", "Application email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="applicationEmail" type="email" placeholder="hr@company.com" className="pl-9 bg-secondary/50" value={draft.applicationEmail} onChange={(e) => updateDraft({ applicationEmail: e.target.value })} />
                  </div>
                  <FieldError field="applicationEmail" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicationUrl">{t("sell.applicationUrl", "Application URL")}</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="applicationUrl" type="url" placeholder="https://…" className="pl-9 bg-secondary/50" value={draft.applicationUrl} onChange={(e) => updateDraft({ applicationUrl: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Country + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>{t("sell.country")}</Label>
                <Select value={draft.country || ""} onValueChange={(val) => updateDraft({ country: val })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sell.select")} /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map((c) => (<SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("sell.city")}</Label>
                <Input id="city" placeholder={t("sell.cityPlaceholder")} className="bg-secondary/50" value={draft.city || ""} onChange={(e) => updateDraft({ city: e.target.value })} />
              </div>
            </div>

            {/* Location (legacy) */}
            <div className="space-y-2">
              <Label htmlFor="location">{t("sell.location")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="location" placeholder={t("sell.locationPlaceholder")} className="pl-9 bg-secondary/50" value={draft.location} onChange={(e) => updateDraft({ location: e.target.value })} />
              </div>
            </div>

            {/* Contact method */}
            <div className="space-y-2 min-w-0">
              <Label>{t("sell.contactMethod")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
                {CONTACT_METHODS.map((cm) => {
                  const Icon = contactIcons[cm.value];
                  const selected = draft.contactMethod === cm.value;
                  return (
                    <button key={cm.value} type="button" onClick={() => updateDraft({ contactMethod: cm.value })}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-[0.98] min-w-0 ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
                      <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{cm.label}</span>
                    </button>
                  );
                })}
              </div>
              {(draft.contactMethod === "phone" || draft.contactMethod === "whatsapp" || draft.contactMethod === "viber") && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("sell.phoneFromProfile", "Numri i telefonit do të merret nga profili juaj. Sigurohuni që ta keni vendosur në faqen e Profilit.")}
                </p>
              )}
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("sell.listingType")} *</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => updateDraft({ listingType: "free" })}
                  className={`p-3 sm:p-4 rounded-xl border text-center transition-all active:scale-[0.98] ${
                    draft.listingType === "free"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Clock className={`h-5 w-5 mx-auto mb-1.5 ${draft.listingType === "free" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs sm:text-sm font-display font-bold block ${draft.listingType === "free" ? "text-primary" : "text-foreground"}`}>
                    {t("sell.freeListing")}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground block mt-1">{t("sell.freeTag")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ listingType: "paid" })}
                  className={`p-3 sm:p-4 rounded-xl border text-center transition-all active:scale-[0.98] ${
                    draft.listingType === "paid"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Sparkles className={`h-5 w-5 mx-auto mb-1.5 ${draft.listingType === "paid" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs sm:text-sm font-display font-bold block ${draft.listingType === "paid" ? "text-primary" : "text-foreground"}`}>
                    {t("sell.paidListing")}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground block mt-1">{t("sell.paidTag")}</span>
                </button>
              </div>
            </div>

            {!isRides && (
              <p className="text-[11px] text-muted-foreground/60 text-center">{t("sell.draftAutoSaved")}</p>
            )}
              </>
            )}

            <Button
              variant="gold"
              className="w-full h-12 text-base font-semibold active:scale-[0.99] transition-transform"
              type="submit"
              disabled={isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isRides ? t("sell.publishRide") : t("sell.publish")}
                </>
              ) : (
                <>
                  {isRides ? <Car className="h-4 w-4 mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                  {isRides ? t("sell.publishRide") : t("sell.publish")}
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Sell;
