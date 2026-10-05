# Dependable Clean Client

This client runs on Next.js 16 and React 19. The current UI lives in `src/design`; the previous UI is kept under `src/legacy` for reference.

From the combined `Dependable-clean` folder, run `npm install` once and then `npm run dev` to start both the client and API. The client uses port 3000. See the parent README for server environment setup.

To run the client on its own, run `npm install` and `npm run dev` in this folder. The client calls the API at `http://localhost:5000` unless `NEXT_PUBLIC_API_URL` is set.

The home page hero is a product slider: each slide pairs a service with a cleaning product drawn in `src/design/Products.js`. Slide and offer content is in `src/design/data.js`, and the slider styles are split across `src/design/products.css`, `carousel.css` and `hero-slider.css`, with layout fixes in `responsive.css`.
