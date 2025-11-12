// File: scripts/__dropins__/my-custom-dropin/my-custom-dropin.js

// Optional: import shared utilities, config, etc.
import { rootLink } from '../../scripts/commerce.js';
import './my-custom-dropin.css'; // your styles

export default async function decorate(block) {
  // You can access block.dataset or classes if needed
  const html = `
    <div class="my-dropin-banner">
      <h3>Special Offer 🎉</h3>
      <p>Get 10% off your first order.</p>
      <a href="${rootLink('/special-offer')}" class="my-dropin-btn">Shop Now</a>
    </div>
  `;

  // Inject raw HTML into this block container
  block.innerHTML = html;
}
