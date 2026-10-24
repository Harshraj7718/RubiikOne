import Hero from "../sections/Hero.jsx";
import Owners from "../sections/Owners.jsx";
import Manifesto from "../sections/Manifesto.jsx";
import Meaning from "../sections/Meaning.jsx";
import Vision from "../sections/Vision.jsx";
import Collection from "../sections/Collection.jsx";
import Gallery from "../sections/Gallery.jsx";
import Blueprint from "../sections/Blueprint.jsx";
import Details from "../sections/Details.jsx";
import Experience from "../sections/Experience.jsx";
import Limited from "../sections/Limited.jsx";
import PreBook from "../sections/PreBook.jsx";
import Finale from "../sections/Finale.jsx";
import { Marquee } from "../components/motion.jsx";
import { PRODUCTS } from "../data/catalog.js";

const [AUTOMATIC, QUARTZ] = PRODUCTS;

export default function Home({ ready }) {
  return (
    <>
      <Hero ready={ready} />
      <Owners />
      <Marquee
        className="border-y border-ivory/10 py-5 font-sans text-[12px] uppercase tracking-mega text-ivory/60"
        items={["Limited to 200 pieces", "Pre-booking from 6 November · 20% off", "Launching 25 December", "Every second has a shape"]}
      />
      <Manifesto />
      <Meaning />
      <Vision />
      <Collection />
      <Gallery />
      <Blueprint
        product={AUTOMATIC}
        sky="/images/sky-desert.webp"
        panel="linear-gradient(180deg, #141F2A 0%, #070C11 100%)"
        quote="Time is universal, but every person experiences it differently."
        attribution="The RUBIIK philosophy"
        place={["The dune sea", "Golden hour", "Water resistant 5 ATM"]}
        labels={["Automatic Skeleton", "All Stainless Steel"]}
      />
      <Details />
      <Experience />
      <Blueprint
        product={QUARTZ}
        sky="/images/sky-coast.webp"
        panel="linear-gradient(180deg, #A50003 0%, #4D0002 100%)"
        quote="Every line has intention. Every angle has purpose."
        attribution="The RUBIIK design code"
        place={["The coastline", "At dusk", "Japanese quartz"]}
        labels={["Quartz Olive", "Brushed Olive Steel"]}
        flip
      />
      <Limited />
      <PreBook />
      <Finale />
    </>
  );
}
