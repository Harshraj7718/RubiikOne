// When owners can expect their watch; shown once payment is complete.
import { formatDate, LAUNCH } from "../data/catalog.js";

export default function DeliveryNote({ className = "" }) {
  return (
    <div className={`flex w-fit items-center gap-4 border border-gold/40 bg-gold/5 px-5 py-3 text-left ${className}`}>
      <span className="h-2 w-2 shrink-0 rotate-45 bg-gold" />
      <p className="text-sm text-ivory-dim">
        Delivery begins from <span className="font-serif text-lg text-ivory">{formatDate(LAUNCH.deliveryFrom, { year: "numeric" })}</span>, with complimentary
        insured shipping across India.
      </p>
    </div>
  );
}
