// Terms of Service: the rules of the RUBIIK ONE edition, pre-booking, pricing, payment and delivery.
import { PRODUCTS, LAUNCH, formatINR, formatDate, unitPrice } from "../data/catalog.js";
import { MAX_PER_MODEL } from "../lib/shop.jsx";
import LegalPage, { Section, List, Strong, Mail } from "../components/LegalPage.jsx";
import { CONTACT } from "../data/legal.js";

const launchDate = new Date(LAUNCH.launch).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const gst = `${Math.round(LAUNCH.gstRate * 100)}%`;
const discount = `${Math.round(LAUNCH.prebookDiscount * 100)}%`;

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`RUBIIK is a product of ${CONTACT.company}. These terms apply when you use this website, create a RUBIIK account or pre-order a RUBIIK ONE watch. By placing an order you agree to them, so please read them carefully.`}
      other={{ to: "/privacy", label: "Privacy Policy" }}
    >
      <Section n="1" title="The edition">
        <p>
          RUBIIK ONE is made in two limited editions of <Strong>{LAUNCH.editionPerModel} numbered pieces each</Strong>, one per model ({LAUNCH.editionPerModel * PRODUCTS.length} in all). Each watch is numbered within its model. Once a model's pieces are sold, its edition closes and
          will not be produced again. Pieces are offered while they last.
        </p>
      </Section>

      <Section n="2" title="Prices and GST">
        <p>Prices are maximum retail prices (MRP) in Indian Rupees, inclusive of {gst} GST. You pay the price shown; nothing is added at checkout.</p>
        <List
          items={PRODUCTS.map((p) => (
            <>
              <Strong>{p.edition}</Strong> — MRP {formatINR(p.price)}; {formatINR(unitPrice(p, "prebook"))} during pre-booking (both incl. GST).
            </>
          ))}
        />
        <p>
          The price charged is the one shown in your checkout summary when you pay. If a price is shown incorrectly because of an error, we may cancel the affected order and
          refund you in full.
        </p>
      </Section>

      <Section n="3" title="Pre-booking">
        <List
          items={[
            `Pre-booking is open until the launch on ${launchDate}. Pre-orders receive a ${discount} privilege on the MRP.`,
            `Each order may include up to ${MAX_PER_MODEL} pieces of each model.`,
            "You need a RUBIIK account to pre-order. You are responsible for keeping your password safe and for activity on your account.",
            "When you continue to payment, your pieces are held for 30 minutes. If payment is not completed in that time, they are released to other clients.",
          ]}
        />
      </Section>

      <Section n="4" title="Payment">
        <p>
          Payments are processed securely by Razorpay. Your order is confirmed only when payment is verified. A held order that is not paid is not an order and creates no
          obligation for either party.
        </p>
      </Section>

      <Section n="5" title="Certificate of edition">
        <p>
          When your payment is confirmed, each watch is given the next number in the edition and a unique serial number (for example RBK-AS-017-7F3C), shown on your certificate
          of edition in your account. Numbers are issued in the order payments are confirmed and cannot be chosen or changed.
        </p>
      </Section>

      <Section n="6" title="Delivery">
        <p>
          Watches are shipped from {formatDate(LAUNCH.deliveryFrom, { year: "numeric" })}, after the launch on {launchDate}, with complimentary insured delivery to addresses in India. Please make sure your delivery details are correct;
          someone may need to be present to sign for the parcel. We will keep you informed if anything delays your delivery.
        </p>
      </Section>

      <Section n="7" title="Cancellations and refunds">
        <List
          items={[
            <>
              You may cancel a paid pre-order at any time before your watch is dispatched by writing to <Mail /> with your order number. We will refund the full amount paid,
              including GST, to your original payment method.
            </>,
            "When a pre-order is cancelled, its edition number is released and may be issued to another client.",
            "After delivery, a watch can be returned only if it arrives damaged or faulty. Please contact us within 48 hours of delivery with your order number and photographs.",
            "Refunds are usually processed within 7–10 working days of approval; your bank may take longer to show them.",
          ]}
        />
      </Section>

      <Section n="8" title="Warranty">
        <p>
          Each RUBIIK ONE is covered against manufacturing defects as set out in the warranty card supplied with the watch. The warranty does not cover normal wear, accidental
          damage, water damage beyond the rated 5 ATM, or repairs by anyone other than RUBIIK or its authorised service partners.
        </p>
      </Section>

      <Section n="9" title="Founding Owners wall">
        <p>
          If you opt in, your chosen display name and certificate appear on the Founding Owners wall. Please choose a name that is not offensive or misleading; we may edit or
          remove names that are. You can ask us to remove yours at any time.
        </p>
      </Section>

      <Section n="10" title="Using this website">
        <p>
          All designs, photographs, text and the RUBIIK name and marks on this website belong to RUBIIK. You may not copy or reuse them without our written permission, misuse
          the website, attempt to access other people’s accounts, or buy pieces for automated resale.
        </p>
      </Section>

      <Section n="11" title="Liability">
        <p>
          We are not liable for delays or failures caused by events outside our reasonable control. Our total liability for any order is limited to the amount you paid for it.
          Nothing in these terms limits rights you have under Indian consumer protection law.
        </p>
      </Section>

      <Section n="12" title="Governing law">
        <p>These terms are governed by the laws of India, and any dispute is subject to the jurisdiction of the courts of India.</p>
      </Section>

      <Section n="13" title="Changes and contact">
        <p>
          We may update these terms; the version shown when you place your order applies to that order. Questions can be sent to <Mail />, or by post to {CONTACT.company}, {CONTACT.address.join(", ")}.
        </p>
      </Section>
    </LegalPage>
  );
}
