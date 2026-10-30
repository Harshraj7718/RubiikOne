import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// RUBIIK's Meta Pixel ID (public: it is visible in every visitor's browser). VITE_META_PIXEL_ID overrides it.
const META_PIXEL_ID = "2624778291293532";

/**
 * Meta Pixel: adds Meta's base code at the end of <head> (below the existing tags, above </head>)
 * on every page of the built site. It is left out of the dev server, and the code itself skips
 * localhost, so testing never shows up in RUBIIK's ad data.
 * Shopping events (ViewContent, AddToCart, InitiateCheckout, Purchase) are sent from src/lib/pixel.js.
 */
function metaPixel(id) {
  return {
    name: "meta-pixel",
    apply: "build",
    transformIndexHtml(html) {
      if (!id) return html;
      if (!/^\d{6,20}$/.test(id)) throw new Error(`VITE_META_PIXEL_ID should be the numeric Pixel ID from Meta Events Manager, got "${id}".`);
      const code = `
    <!-- Meta Pixel Code -->
    <script>
      if (!/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
      fbq('track', 'PageView');
      }
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->
  `;
      return html.replace("</head>", `${code}</head>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), metaPixel(env.VITE_META_PIXEL_ID?.trim() || META_PIXEL_ID)],
    // "@/..." points at src/, matching the shadcn convention (e.g. "@/components/ui/glyph-swell").
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      rollupOptions: {
        output: {
          // Libraries change rarely: separate files let browsers keep them cached across site updates.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion", "lenis"],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: { "/api": "http://localhost:8787" },
    },
  };
});
