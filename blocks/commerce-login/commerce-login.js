import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';

import {
  Button,
  Input,
  TextArea,
  provider as UI,
} from '@dropins/tools/components.js';

import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  checkIsAuthenticated,
  rootLink,
} from '../../scripts/commerce.js';

import '../../scripts/initializers/auth.js';

import createModal from '../modal/modal.js';

export default async function decorate(block) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return;
  }

  await authRenderer.render(SignIn, {
    routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
    routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
  })(block);

  const wrapper = await waitForElement('.section.commerce-login-container');

  const giftFragment = document.createRange().createContextualFragment(`
    <div class='gift-options-container'>
      <form id='gift-options-form' class='checkout-fields-form__form' novalidate>
        <h2>Gift Message</h2>

        <div class='toName-wrapper'></div>
        <small class='error-message toName-error'></small>

        <div class='fromName-wrapper'></div>
        <small class='error-message fromName-error'></small>

        <div class='giftMessage-wrapper dropin-field dropin-field--multiline'></div>
        <small class='error-message giftMessage-error'></small>

        <div class='submit-wrapper'></div>

        <button id='open-demo-modal' type='button' style='margin-top:20px;'>
          Open Demo Modal
        </button>

        <div id='api-output' style='margin-top:20px; padding:10px; border:1px solid #ddd;'>
          Loading API...
        </div>
      </form>
    </div>
  `);

  wrapper.append(giftFragment);

  const formContainer = wrapper.querySelector('.gift-options-container');
  const form = formContainer.querySelector('#gift-options-form');

  // UI Components
  UI.render(Input, {
    type: 'text',
    name: 'toName',
    placeholder: 'To',
    floatingLabel: 'To Name',
  })(formContainer.querySelector('.toName-wrapper'));

  UI.render(Input, {
    type: 'text',
    name: 'fromName',
    placeholder: 'From',
    floatingLabel: 'From Name',
  })(formContainer.querySelector('.fromName-wrapper'));

  UI.render(TextArea, {
    name: 'giftMessage',
    placeholder: 'Message',
  })(formContainer.querySelector('.giftMessage-wrapper'));

  UI.render(Button, {
    variant: 'primary',
    children: 'Add Message',
    type: 'submit',
  })(formContainer.querySelector('.submit-wrapper'));

  // -------------------------------
  // ⭐ FORM VALIDATION
  // -------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const toName = form.querySelector('input[name="toName"]');
    const fromName = form.querySelector('input[name="fromName"]');
    const giftMessage = form.querySelector('textarea[name="giftMessage"]');

    let isValid = true;

    // Clear old errors
    clearError('toName');
    clearError('fromName');
    clearError('giftMessage');

    // Validate To Name
    if (!toName.value.trim()) {
      showError('toName', 'To Name is required');
      isValid = false;
    }

    // Validate From Name
    if (!fromName.value.trim()) {
      showError('fromName', 'From Name is required');
      isValid = false;
    }

    // Validate Message
    if (!giftMessage.value.trim()) {
      showError('giftMessage', 'Message is required');
      isValid = false;
    } else if (giftMessage.value.trim().length < 5) {
      showError('giftMessage', 'Message must be at least 5 characters');
      isValid = false;
    }

    if (!isValid) return;

    alert('Form submitted successfully!');
  });

  function showError(field, message) {
    const errorEl = form.querySelector(`.${field}-error`);
    errorEl.textContent = message;
    errorEl.style.color = 'red';

    const inputEl = form.querySelector(`[name="${field}"]`);
    if (inputEl) {
      inputEl.style.borderColor = 'red';
    }
  }

  function clearError(field) {
    const errorEl = form.querySelector(`.${field}-error`);
    errorEl.textContent = '';

    const inputEl = form.querySelector(`[name="${field}"]`);
    if (inputEl) {
      inputEl.style.borderColor = '';
    }
  }

  // Demo Modal
  const demoModalBtn = formContainer.querySelector('#open-demo-modal');

  demoModalBtn.addEventListener('click', async () => {
    const modalContent = document.createRange().createContextualFragment(`
      <div class='demo-modal-content'>
        <h2>Demo Modal</h2>
        <p>This is a simple demo modal using createModal().</p>
      </div>
    `);

    const modal = await createModal([modalContent]);
    modal.block.setAttribute('id', 'demo-modal');
    modal.showModal();
  });

  // Demo API
  const output = formContainer.querySelector('#api-output');

  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const data = await res.json();

    output.innerHTML = `
      <h3>Demo API Data</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  } catch (err) {
    output.innerHTML = 'API Error';
    console.error(err);
  }
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector(selector);
      if (el) resolve(el);
      else requestAnimationFrame(check);
    };
    check();
  });
}
