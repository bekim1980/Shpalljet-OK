import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, DollarSign, Tag, FileText, MapPin, Crown, Store, Home, Briefcase,
  Package, MessageSquare, Phone, Send, Clock, Sparkles,
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
import { VERTICAL_CATEGORIES, CONDITIONS, PRICE_PERIODS, CONTACT_METHODS } from "@/data/verticalConfig";
import { useDraftListing } from "@/hooks/useDraftListing";
import { useCategories } from "@/hooks/useCategories";

const verticalIcons: Record<Vertical, React.ElementType> = { luxe: Crown, market: Store, rent: Home, services: Briefcase };
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

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center space-y-4">
          <p className="text-muted-foreground font-display text-lg">{t("sell.loginRequired")}</p>
          <Button variant="gold" onClick={() => navigate("/login", { state: { from: "/sell" } })}>{t("common.login")}</Button>
        </div>
      </div>
    );
  }

  const handleImagesChange = (newImages: File[], newPreviews: string[]) => { setImages(newImages); setPreviews(newPreviews); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.selectedVertical) errs.vertical = t("sell.selectSection");
    if (!draft.title.trim()) errs.title = t("sell.titleRequired");
    if (!draft.category) errs.category = t("sell.selectCategory");
    if (images.length === 0) errs.images = t("sell.imageRequired", "Please add at least one image");
    if (draft.selectedVertical === "luxe" || draft.selectedVertical === "market") {
      if (!draft.price) errs.price = t("sell.setPrice");
      if (!draft.condition) errs.condition = t("sell.selectCondition");
    }
    if (draft.selectedVertical === "rent") { if (!draft.price) errs.price = t("sell.setPrice"); }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error(t("sell.fillRequired")); return; }
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-lg py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold mb-1">{t("sell.title")}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t("sell.subtitle")}</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("sell.section")} *</Label>
              <div className="grid grid-cols-4 gap-2">
                {VERTICALS.map((vert) => {
                  const Icon = verticalIcons[vert.value];
                  const selected = v === vert.value;
                  return (
                    <button key={vert.value} type="button" onClick={() => {
                      if (v && v !== vert.value && draft.category) {
                        if (!window.confirm(t("sell.switchVerticalConfirm", "Switching section will reset your category. Continue?"))) return;
                      }
                      updateDraft({ selectedVertical: vert.value, category: "", condition: "" });
                    }}
                      className={`p-3 rounded-xl border text-center transition-all ${selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"}`}>
                      <Icon className={`h-5 w-5 mx-auto mb-1.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[11px] font-display font-bold block ${selected ? "text-primary" : "text-foreground"}`}>{vert.label}</span>
                    </button>
                  );
                })}
              </div>
              <FieldError field="vertical" />
            </div>

            <ImageUploader images={images} previews={previews} onImagesChange={handleImagesChange} />
            <FieldError field="images" />

            <div className="space-y-2">
              <Label htmlFor="title">{t("sell.titleField")} *</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="title" placeholder={v === "services" ? t("sell.placeholders.serviceTitle") : v === "rent" ? t("sell.placeholders.rentTitle") : t("sell.placeholders.luxeTitle")} className="pl-9 bg-secondary/50" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} maxLength={100} />
              </div>
              <FieldError field="title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("sell.description")}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea id="description" placeholder={v === "services" ? t("sell.placeholders.serviceDesc") : v === "rent" ? t("sell.placeholders.rentDesc") : t("sell.placeholders.luxeDesc")} className="pl-9 bg-secondary/50 min-h-[100px]" value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} maxLength={2000} />
              </div>
            </div>

            {(v === "luxe" || v === "market" || v === "rent") && (
              <div className={`grid gap-4 ${v === "rent" ? "grid-cols-3" : "grid-cols-2"}`}>
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
              <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="location">{t("sell.location")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="location" placeholder={t("sell.locationPlaceholder")} className="pl-9 bg-secondary/50" value={draft.location} onChange={(e) => updateDraft({ location: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("sell.contactMethod")}</Label>
              <div className="grid grid-cols-4 gap-2">
        
