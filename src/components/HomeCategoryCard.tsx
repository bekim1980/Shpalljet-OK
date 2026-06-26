import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export interface HomeCategoryCardProps {
  href: string;
  label: string;
  tagline: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
  iconBox: string;
  delay?: number;
  badge?: string;
  onClick?: () => void;
}

const HomeCategoryCard = ({
  href,
  label,
  tagline,
  icon: Icon,
  gradient,
  accent,
  iconBox,
  delay = 0,
  badge,
  onClick,
}: HomeCategoryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.38 }}
    className="h-full"
  >
    <Link
      to={href}
      onClick={onClick}
      className={`group relative flex h-full min-h-[118px] flex-col justify-between overflow-hidden rounded-xl border border-white/[0.07] p-3.5 sm:min-h-[132px] sm:rounded-2xl sm:p-4 md:min-h-[148px] md:p-5 bg-gradient-to-br ${gradient} transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-2xl hover:shadow-black/35 active:scale-[0.98] active:duration-150`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`} />
      <div className="absolute inset-0 bg-white/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {badge && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[hsl(var(--gold))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(0_0%_6%)] shadow-md shadow-black/20 sm:text-[10px]">
          {badge}
        </span>
      )}

      <div className={`relative flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${iconBox}`}>
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
      </div>

      <div className="relative mt-2.5 pr-6 sm:mt-3">
        <h3 className="font-display text-sm font-bold leading-tight tracking-wide text-white sm:text-base md:text-lg">
          {label}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/70 sm:text-xs">
          {tagline}
        </p>
      </div>

      <ArrowRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/70 sm:bottom-4 sm:right-4 sm:h-4 sm:w-4" />
    </Link>
  </motion.div>
);

export default HomeCategoryCard;
