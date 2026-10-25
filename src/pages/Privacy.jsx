// Privacy Policy: what the store collects (accounts, pre-orders, waitlist, owners wall) and why.
import LegalPage, { Section, List, Strong, Mail } from "../components/LegalPage.jsx";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="RUBIIK (“RUBIIK”, “we”, “us”) sells the RUBIIK ONE limited edition through this website. This policy explains what personal information we collect when you browse, create an account, join the waitlist or pre-order a watch, how we use it, and the choices you have."
      other={{ to: "/terms", label: "Terms of Service" }}
    >
      <Section n="1" title="Information we collect">
        <p>We only collect what we need to sell, number and deliver your watch:</p>
        <List
          items={[
            <>
              <Strong>Account details</Strong> — your name, email address and password. Passwords are stored only as a secure one-way hash; we can never see them.
            </>,
            <>
              <Strong>Pre-order and delivery details</Strong> — phone number, delivery address, city and PIN code, the watches you reserve, and the amounts charged.
            </>,
            <>
              <Strong>Certificate details</Strong> — the edition number and serial issued to each watch you own, linked to your name.
            </>,
            <>
              <Strong>Founding Owners wall</Strong> — if you choose to appear on the wall, the display name you pick. You can opt out at checkout.
            </>,
            <>
              <Strong>Waitlist</Strong> — the email address you give when you ask to be notified.
            </>,
          ]}
        />
        <p>
          We do not collect or store your card, UPI or bank details. Payments are entered directly into Razorpay’s secure checkout and never pass through our servers.
        </p>
      </Section>

      <Section n="2" title="How we use it">
        <List
          items={[
            "To create and secure your account and keep you signed in.",
            "To reserve your pieces, take payment, issue your certificate of edition and serial number, and deliver your watch.",
            "To contact you about your order, delivery, or the launch.",
            "To show your chosen display name on the Founding Owners wall, only if you opted in.",
            "To prevent fraud and misuse, and to meet our legal, tax and accounting obligations, including GST invoicing.",
          ]}
        />
        <p>We do not sell your personal information, and we do not use it for advertising.</p>
      </Section>

      <Section n="3" title="Who we share it with">
        <p>We share limited information only with the providers that run the store for us:</p>
        <List
          items={[
            <>
              <Strong>Razorpay</Strong> — processes payments and receives what it needs to complete your transaction, under its own privacy policy.
            </>,
            <>
              <Strong>MongoDB Atlas</Strong> — hosts the database where accounts, orders and certificates are stored.
            </>,
            <>
              <Strong>Vercel</Strong> — hosts this website and its servers.
            </>,
            <>
              <Strong>Our delivery partner</Strong> — receives your name, phone number and address to deliver your watch.
            </>,
          ]}
        />
        <p>We may also disclose information when required by law or to protect our rights and our customers.</p>
      </Section>

      <Section n="4" title="Cookies and local storage">
        <List
          items={[
            "A sign-in cookie keeps you logged in for up to 30 days. It is essential to your account and is removed when you sign out.",
            "Your browser’s local storage remembers the watches in your selection, so your cart is still there when you return.",
          ]}
        />
        <p>We do not use advertising or third-party tracking cookies.</p>
      </Section>

      <Section n="5" title="Security">
        <p>
          All traffic to this website is encrypted with HTTPS. Passwords are hashed, sign-in sessions are stored only as hashes, and access to customer data is restricted
          to authorised RUBIIK staff. No system is perfectly secure, but we take reasonable measures to protect your information.
        </p>
      </Section>

      <Section n="6" title="How long we keep it">
        <p>
          We keep account and order records for as long as your account is open and as long as needed afterwards for warranty, tax and accounting requirements. Pre-orders
          that are never paid are released after 30 minutes. Waitlist emails are kept until you ask us to remove them.
        </p>
      </Section>

      <Section n="7" title="Your rights">
        <p>You can ask us at any time to:</p>
        <List
          items={[
            "see the personal information we hold about you;",
            "correct anything that is inaccurate;",
            "delete your account and information, except records we must keep by law;",
            "remove your name from the Founding Owners wall; or",
            "stop sending you launch updates.",
          ]}
        />
        <p>
          Write to <Mail /> and we will respond within 30 days.
        </p>
      </Section>

      <Section n="8" title="Children">
        <p>This website is not intended for anyone under 18, and we do not knowingly collect information from children.</p>
      </Section>

      <Section n="9" title="Changes to this policy">
        <p>If we change this policy, we will post the new version here and update the date at the top.</p>
      </Section>

      <Section n="10" title="Contact">
        <p>
          Questions about your privacy can be sent to <Mail />.
        </p>
      </Section>
    </LegalPage>
  );
}
