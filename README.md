# Fein Restaurant Website

Fein is a static multi-page restaurant website built with plain HTML, CSS, and JavaScript. It includes a landing experience, menu browsing, table booking, contact details, and a client-side checkout demo that keeps the cart in `localStorage`.

## Preview

<table>
  <tr>
    <td width="33.33%"><img src="assets/images/readme/home-demo.svg" alt="Fein home page preview" /></td>
    <td width="33.33%"><img src="assets/images/readme/menu-demo.svg" alt="Fein menu page preview" /></td>
    <td width="33.33%"><img src="assets/images/readme/payment-demo.svg" alt="Fein payment page preview" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Home</strong><br>Hero section, featured meals, offers, and testimonials</td>
    <td align="center"><strong>Menu</strong><br>Menu table, quick ordering, and cart actions</td>
    <td align="center"><strong>Checkout</strong><br>Delivery setup, promo codes, and payment demo</td>
  </tr>
</table>

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage` for cart persistence
- Web3Forms for the table booking form

## Key Features

- Multi-page restaurant site with a dedicated page for each core section
- Shared cart flow between `home.html`, `menu.html`, and `payment.html`
- Checkout demo with:
  - quantity updates
  - delivery speed selection
  - promo codes
  - tax and service fee calculation
  - card, mobile money, and cash-on-delivery UI states
- Table booking form connected to Web3Forms
- Responsive navigation with mobile menu toggle
- Visual assets organized under `assets/images/`

## Page Map

```mermaid
flowchart TD
    A[index.html] --> B[home.html]
    B --> C[about.html]
    B --> D[menu.html]
    B --> E[booky.html]
    B --> F[contact.html]
    B --> G[payment.html]
    D --> G
    C --> G
    B -->|Add to cart| H[(localStorage: fein-cart)]
    D -->|Add to cart| H
    H --> G
    E --> I[Web3Forms submission]
```

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Redirect entry that sends visitors to `home.html` |
| `home.html` | Main landing page with featured dishes, offers, and testimonials |
| `about.html` | Brand story, restaurant intro, and team section |
| `menu.html` | Full menu table with add-to-cart actions |
| `booky.html` | Table reservation form |
| `contact.html` | Contact details, media, and location-focused content |
| `payment.html` | Demo checkout and payment experience |

## Project Structure

| Path | Purpose |
| --- | --- |
| `assets/images/` | Photos, illustrations, and README preview assets |
| `style.css` | Main styling for the home page |
| `css2.css` | Shared styling for inner pages |
| `payment.css` | Checkout-specific styling |
| `site.js` | Shared cart, navigation, toast, and cross-page order flow |
| `payment.js` | Checkout summary, promo, delivery, and payment interactions |

## Run Locally

This project does not need a build step.

1. Open the project folder in PowerShell.
2. Start a local server:

```powershell
python -m http.server 8000
```

3. Open `http://localhost:8000/` in your browser.

You can also open `index.html` directly, but a local server gives more reliable browser behavior during testing.

## Customization

- Update menu items and pricing in `home.html` and `menu.html`
- Replace the booking form `access_key` in `booky.html` with your own Web3Forms key
- Adjust promo codes, fees, and tax rules in `payment.js`
- Swap images inside `assets/images/` to match your own restaurant brand
- Edit copy, phone number, and email text directly in the HTML pages

## Important Notes

- `payment.html` is a front-end demo checkout, not a real payment gateway integration.
- Cart data is stored in browser `localStorage` under the `fein-cart` key.
- Booking submissions depend on Web3Forms and require internet access.
- Google Fonts and Font Awesome are loaded from external CDNs, so those assets also require internet access.

## Screenshot Assets

<p align="center">
  <img src="assets/images/main.jpg" alt="Signature burger and fries" width="32%" />
  <img src="assets/images/o1.jpg" alt="Burger offer image" width="32%" />
  <img src="assets/images/o2.jpg" alt="Pizza offer image" width="32%" />
</p>
