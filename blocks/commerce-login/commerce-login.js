import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';

import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';

import '../../scripts/initializers/auth.js';

import { Button, Input, TextArea, provider as UI } from '@dropins/tools/components.js';

import { getConfigValue } from '../../scripts/configs.js';

// Import modal system
import createModal from '../modal/modal.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return;
  }

    const thirdPartyApiKey = await getConfigValue('third-party-api-key');
console.log('api key', thirdPartyApiKey);

  // Render login UI (async)
  await authRenderer.render(SignIn, {
    routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
    routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
  })(block);

  // Wait for wrapper
  const wrapper = await waitForElement('.section.commerce-login-container');

  // ---------------------------------------
  // Gift Form Fragment
  // ---------------------------------------
  const giftFragment = document.createRange().createContextualFragment(`
    <div class="gift-options-container">
      <form id="gift-options-form" class="checkout-fields-form__form">
        <h2>Gift Message</h2>

        <div class="toName-wrapper"></div>
        <div class="fromName-wrapper"></div>
        <div class="giftMessage-wrapper dropin-field dropin-field--multiline"></div>
        <div class="submit-wrapper"></div>

        <!-- Demo Modal Button -->
        <button id="open-demo-modal" type="button" style="margin-top:20px;">
          Open Demo Modal
        </button>

        <!-- API result -->
        <div id="api-output" style="margin-top:20px; padding:10px; border:1px solid #ddd;">
          Loading API...
        </div>
      </form>
    </div>
  `);

  wrapper.append(giftFragment);

  // Now the fragment is in DOM
  const formContainer = wrapper.querySelector(".gift-options-container");

  // ---------------------------------------
  // Render UI components
  // ---------------------------------------
  UI.render(Input, {
    type: "text",
    name: "toName",
    placeholder: "To",
    floatingLabel: "To Name",
  })(formContainer.querySelector('.toName-wrapper'));

  UI.render(Input, {
    type: "text",
    name: "fromName",
    placeholder: "From",
    floatingLabel: "From Name",
  })(formContainer.querySelector('.fromName-wrapper'));

  UI.render(TextArea, {
    name: "giftMessage",
    placeholder: "Message",
  })(formContainer.querySelector('.giftMessage-wrapper'));

  UI.render(Button, {
    variant: "primary",
    children: "Add Message",
    type: "submit",
  })(formContainer.querySelector('.submit-wrapper'));

  // ---------------------------------------
  // DEMO MODAL
  // ---------------------------------------
  const demoModalBtn = formContainer.querySelector('#open-demo-modal');

  demoModalBtn.addEventListener('click', async () => {
    // Create modal content
    const modalContent = document.createRange().createContextualFragment(`
      <div class="demo-modal-content">
        <h2>Demo Modal</h2>
        <p>This is a simple demo modal using createModal().</p>
      </div>
    `);

    // Create modal using your actual modal system
    const modal = await createModal([modalContent]);

    // Optional: give it an ID
    modal.block.setAttribute("id", "demo-modal");

    modal.showModal();
  });

  // ---------------------------------------
  // DEMO API CALL
  // ---------------------------------------
  const output = formContainer.querySelector('#api-output');

  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const data = await res.json();

    output.innerHTML = `
      <h3>Demo API Data</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  } catch (err) {
    output.innerHTML = "API Error";
    console.error(err);
  }
}

// WAIT HELPER
function waitForElement(selector) {
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(selector);
      if (el) resolve(el);
      else requestAnimationFrame(check);
    };
    check();
  });
}
