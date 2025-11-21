/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-unresolved */
import { events } from '@dropins/tools/event-bus.js';

let cryptoJsModulePromise;
async function getCryptoJS() {
  if (!cryptoJsModulePromise) {
    cryptoJsModulePromise = import('https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm');
  }
  const module = await cryptoJsModulePromise;
  return module.default || module;
}

// SnapPay API endpoint (called server-side via App Builder)
const SNAP_PAY_API_ENDPOINT = 'https://restapi-stage.snappayglobal.com/api/interop/GetRequestID';
// App Builder endpoint (proxy to avoid CORS issues)
const APP_BUILDER_ENDPOINT = 'https://748062-cortfurniture-stage.adobeioruntime.net/api/v1/web/webhook/capture-checkout';
const SNAP_PAY_SECRET = '6YRvSZXx/V7G1J7nmmMzbRqvcxh9wUCnkuWNiVKQ9+g=';
const SNAP_PAY_ACCOUNT_ID = '1002063168';
const SNAP_PAY_USERNAME = '1002063168';
const SNAP_PAY_PASSWORD = '-N$9pAu5L';

// Helper function to generate UUID (with fallback for older browsers)
function generateUUID() {
  // Try Web Crypto API first (available in modern browsers)
  // Check both window.crypto and global crypto
  const webCrypto = (typeof window !== 'undefined' && window.crypto) || (typeof crypto !== 'undefined' ? crypto : null);
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = Math.floor(Math.random() * 16);
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getHmacSignatureForSnappay(method, url, requestContent) {
  // Fixed constants from the Java code
  const accountId = '1002063168';
  const secretKeyBase64 = '6YRvSZXx/V7G1J7nmmMzbRqvcxh9wUCnkuWNiVKQ9+g=';

  // 1. Generate Timestamp (in seconds) and Nonce (UUID)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Use Web Crypto API for UUID generation (browser-compatible) with fallback
  const nonce = generateUUID();

  // eslint-disable-next-line no-console
  console.log(`Nonce used is: ${nonce}`);
  // eslint-disable-next-line no-console
  console.log(`timestamp is: ${timestamp}`);

  // 2. Content Preparation
  // NOTE: The original Java code calculated an MD5 hash but then explicitly
  // overrode it to use the raw requestContent string. We replicate this exact behavior.
  const mdresult = requestContent; // Equivalent to the Java line: mdresult = contentToEncode;
  // eslint-disable-next-line no-console
  console.log(`mdresult is: ${mdresult}`);

  // 3. Construct the raw data string for HMAC calculation
  const signatureRawData = accountId + method + url + timestamp + nonce + mdresult;

  // 4. Decode the Base64 Secret Key and convert to WordArray for crypto-js
  const CryptoJS = await getCryptoJS();
  const secretKeyBytes = CryptoJS.enc.Base64.parse(secretKeyBase64);

  // 5. Calculate HMAC-SHA256 using crypto-js
  let HmacData64String = '';
  try {
    // Calculate HMAC-SHA256 using crypto-js
    const hmac = CryptoJS.HmacSHA256(signatureRawData, secretKeyBytes);
    // Get the HMAC result as a Base64 string
    const signature64String = hmac.toString(CryptoJS.enc.Base64);
    // eslint-disable-next-line no-console
    console.log(`Request Signature converted to base 64 string is: ${signature64String}`);
    // 6. Construct HmacData string
    const HmacData = `${accountId}:${signature64String}:${nonce}:${timestamp}`;
    // eslint-disable-next-line no-console
    console.log(`HmacData: ${HmacData}`);

    // 7. Base64 Encode HmacData using crypto-js
    HmacData64String = CryptoJS.enc.Utf8.parse(HmacData).toString(CryptoJS.enc.Base64);
    // eslint-disable-next-line no-console
    console.log(`Hmac ${HmacData64String}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during HMAC calculation:', e.message);
  }
  return `Hmac ${HmacData64String}`;
}

// Main execution block (equivalent to Java's main method)
async function buildSnapPayPayload({
  orderData,
}) {
  const customerEmail = orderData?.email
    || orderData?.customerEmail
    || 'johnsmith@abc.com';
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Email from order data:', customerEmail);

  // Extract order subtotal - check multiple possible paths
  // For CartModel: subtotal.includingTax.value or subtotal.excludingTax.value
  // For OrderDataModel: subtotalInclTax.value or subtotalExclTax.value
  const rawSubtotal = orderData?.subtotal?.includingTax?.value
    || orderData?.subtotal?.excludingTax?.value
    || orderData?.subtotalInclTax?.value
    || orderData?.subtotalExclTax?.value
    || orderData?.subtotalIncludingTax?.value
    || orderData?.subtotalExcludingTax?.value
    || orderData?.grandTotal?.value
    || orderData?.prices?.grand_total?.value
    || orderData?.totals?.grand_total?.value
    || '0.00';

  // Format the subtotal as a string with 2 decimal places
  const orderSubtotal = typeof rawSubtotal === 'number'
    ? rawSubtotal.toFixed(2)
    : String(rawSubtotal || '0.00');

  // Debug: Log the orderData structure to help identify the correct path
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Order data structure:', {
    hasSubtotal: !!orderData?.subtotal,
    hasSubtotalInclTax: !!orderData?.subtotalInclTax,
    hasTotal: !!orderData?.total,
    hasGrandTotal: !!orderData?.grandTotal,
    subtotalIncludingTax: orderData?.subtotal?.includingTax,
    subtotalExcludingTax: orderData?.subtotal?.excludingTax,
    totalIncludingTax: orderData?.total?.includingTax,
    totalExcludingTax: orderData?.total?.excludingTax,
  });

  // Extract customer name from billing or shipping address
  const billingAddress = orderData?.billingAddress || orderData?.billing_address;
  const shippingAddress = orderData?.shippingAddress || orderData?.shipping_address;
  const address = billingAddress || shippingAddress;
  const firstName = address?.firstname || 'Customer';

  // Extract customer ID
  let customerId = orderData?.customerId
    || orderData?.customer_id
    || orderData?.customer?.id
    || orderData?.id
    || customerEmail;

  // Limit customer ID to 20 characters maximum
  customerId = String(customerId).substring(0, 20);

  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Order subtotal:', orderSubtotal);
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Customer name:', firstName);
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Customer ID:', customerId);

  const method = 'POST';
  const url = SNAP_PAY_API_ENDPOINT;
  // Using a template literal for the JSON string for cleaner formatting
  const requestContent = `{"accountid":"${SNAP_PAY_ACCOUNT_ID}","transactionType":"T","customerid":"${customerId}","userid":"${customerId}","language":"en-US","companycode":"TSE","currencycode":"USD","customername":"${firstName}","paymentmethod":"CC","transactionamount":"${orderSubtotal}","stylecss":"border:2px solid orange; text-align: left;"}`;

  const hmacSignature = await getHmacSignatureForSnappay(method, url, requestContent);
  // eslint-disable-next-line no-console
  console.log(hmacSignature);

  // Return both the HMAC signature and the payload
  return {
    hmacSignature,
    payload: requestContent,
  };
}

export default function decorate(block) {
  block.textContent = '';
  block.setAttribute('hidden', '');

  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder block initialised1');

  const snapPaySecret = SNAP_PAY_SECRET;
  const snapPayAccountId = SNAP_PAY_ACCOUNT_ID;

  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: Using static SnapPay credentials (masked secret).');
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: SnapPay Secret (masked):', snapPaySecret ? `${snapPaySecret.substring(0, 4)}...${snapPaySecret.substring(snapPaySecret.length - 4)}` : 'NOT SET');
  // eslint-disable-next-line no-console
  console.log('Checkout data forwarder: SnapPay Account ID:', snapPayAccountId || 'NOT SET');

  if (!snapPaySecret || !snapPayAccountId) {
    // eslint-disable-next-line no-console
    console.warn('Checkout data forwarder: SnapPay credentials missing (secret and/or account id). HMAC will not be generated.');
  }

  const state = {
    checkout: null,
    cart: null,
    snapPayCallTriggered: false, // Flag to prevent duplicate calls
    snapPayContainer: null, // Container for SnapPay iframe/form
    snapPayToken: null, // Stored token from SnapPay
    cspViolationHandler: null, // CSP violation event handler for cleanup
  };

  events.on('checkout/initialized', (data) => {
    state.checkout = data;
  }, { eager: true });

  events.on('cart/data', (cart) => {
    state.cart = cart;
  }, { eager: true });

  // Helper function to find Bank Transfer payment method container
  function findBankTransferContainer() {
    // Try multiple selectors to find the bank transfer payment method section
    const selectors = [
      '[data-payment-method-code="banktransfer"]',
      '[data-payment-code="banktransfer"]',
      '.payment-method-banktransfer',
      '.checkout-payment-method-banktransfer',
      'input[value="banktransfer"]',
      'input[name*="payment"][value="banktransfer"]',
      'label[for*="banktransfer"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Find the parent container that holds the payment method content
        const container = element.closest('.payment-method, .checkout-payment-method, [class*="payment"], [class*="PaymentMethod"]') || element.parentElement;
        if (container) {
          return container;
        }
      }
    }

    // Fallback: find payment methods container
    const paymentMethodsContainer = document.querySelector('.checkout__payment-methods, [class*="payment-methods"], [class*="PaymentMethods"]');
    return paymentMethodsContainer;
  }

  // Helper function to wait for Bank Transfer container to be available
  async function waitForBankTransferContainer(maxAttempts = 10, delay = 500) {
    for (let i = 0; i < maxAttempts; i += 1) {
      const container = findBankTransferContainer();
      if (container) {
        return container;
      }
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, delay);
      });
    }
    return null;
  }

  // Helper function to create SnapPay iframe container
  function createSnapPayContainer() {
    const container = document.createElement('div');
    container.className = 'snappay-container';
    container.setAttribute('data-snappay-container', 'true');
    container.style.marginTop = '1rem';
    container.style.padding = '1rem';
    container.style.border = '1px solid #e0e0e0';
    container.style.borderRadius = '4px';
    return container;
  }

  // Helper function to sanitize request ID
  function sanitizeRequestId(requestid) {
    // Validate and sanitize requestid - handle both string and number types
    if (!requestid && requestid !== 0) {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Invalid requestid (null/undefined):', requestid);
      displayErrorMessage('Invalid request ID. Please try again or contact support.');
      return null;
    }

    // Convert to string and trim whitespace
    const sanitizedRequestId = String(requestid).trim();
    if (!sanitizedRequestId || sanitizedRequestId === 'null' || sanitizedRequestId === 'undefined') {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Empty or invalid requestid after sanitization:', requestid);
      displayErrorMessage('Invalid request ID. Please try again or contact support.');
      return null;
    }

    return sanitizedRequestId;
  }

  // Helper function to inject SnapPay iframe with requestid
  async function injectSnapPayIframe(requestid) {
    // Remove existing container if any
    if (state.snapPayContainer) {
      // Clean up CSP violation handler
      if (state.cspViolationHandler) {
        document.removeEventListener('securitypolicyviolation', state.cspViolationHandler);
        state.cspViolationHandler = null;
      }
      state.snapPayContainer.remove();
      state.snapPayContainer = null;
    }

    // Sanitize request ID
    const sanitizedRequestId = sanitizeRequestId(requestid);
    if (!sanitizedRequestId) {
      return;
    }

    // Wait for container to be available (payment methods might not be rendered immediately)
    const bankTransferContainer = await waitForBankTransferContainer();
    if (!bankTransferContainer) {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Could not find Bank Transfer payment method container after waiting');
      return;
    }

    // Create SnapPay container
    state.snapPayContainer = createSnapPayContainer();

    // Build URL - use the sanitized requestid directly (don't double-encode)
    // SnapPay expects the requestid as-is in the query parameter
    const url = `https://stage.snappayglobal.com/Interop/InteropRequest?reqno=${sanitizedRequestId}`;

    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Injecting SnapPay iframe with URL:', url);
    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Request ID (raw):', requestid);
    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Request ID (sanitized):', sanitizedRequestId);

    // Create form for token storage
    const form = document.createElement('form');
    form.name = 'tokenform';
    form.id = 'tokenform';
    form.style.cssText = `
      margin-top: 1rem;
      width: 100%;
    `;

    // Create iframe for SnapPay payment form
    const iframe = document.createElement('iframe');
    iframe.id = 'tokenFrame';
    iframe.name = 'tokenFrame';
    iframe.src = url;
    iframe.frameBorder = '0';
    iframe.scrolling = 'auto';
    iframe.allow = 'payment; fullscreen';
    iframe.allowFullscreen = true;
    iframe.style.cssText = `
      width: 100%;
      min-height: 600px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background-color: #fff;
    `;

    // Remove sandbox attribute - it may interfere with CSP frame-ancestors
    // Sandbox restrictions can conflict with frame-ancestors checks
    // Iframe will rely on SnapPay's CSP frame-ancestors directive

    // Add error handling for iframe load failures
    let iframeLoadTimeout;
    let iframeActuallyLoaded = false;

    iframe.addEventListener('load', () => {
      clearTimeout(iframeLoadTimeout);

      // Check if iframe was actually blocked by CSP
      // If CSP blocks it, the iframe.src might be 'about:blank' or empty
      const iframeSrc = iframe.src || iframe.getAttribute('src') || '';
      let currentSrc = '';
      let canAccessLocation = false;
      // Try to access iframe location (will fail for cross-origin, which is expected)
      try {
        currentSrc = iframe.contentWindow?.location?.href || '';
        canAccessLocation = true;
      } catch (e) {
        // Expected - cross-origin iframe location is not accessible due to CORS
        // This is normal and doesn't mean the iframe was blocked
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: Cannot access iframe location (cross-origin - this is normal)');
      }

      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Iframe load event fired', {
        originalSrc: iframeSrc,
        currentSrc: canAccessLocation ? currentSrc : '(cross-origin, not accessible)',
        canAccessLocation,
        iframeSrcMatches: iframeSrc.includes('snappayglobal.com'),
      });
      // Only check currentSrc if we can access it (same-origin)
      if (canAccessLocation && iframeSrc && iframeSrc.includes('snappayglobal.com')) {
        if (currentSrc && !currentSrc.includes('snappayglobal.com') && currentSrc !== 'about:blank') {
          // eslint-disable-next-line no-console
          console.warn('Checkout data forwarder: Iframe may have been redirected or blocked. Original:', iframeSrc, 'Current:', currentSrc);
        } else if (currentSrc === 'about:blank' || !currentSrc) {
          // eslint-disable-next-line no-console
          console.error('Checkout data forwarder: Iframe was blocked by CSP - content is about:blank');
          displayErrorMessage('Payment form cannot be embedded due to Content Security Policy restrictions. SnapPay\'s server is blocking iframe embedding. Please contact SnapPay support to whitelist your domain in their CSP frame-ancestors directive.');
          iframeActuallyLoaded = false;
          return;
        }
      }

      // For cross-origin iframes, we can't check the location, but if the load event fired
      // and there's no CSP error in console, it likely loaded successfully
      iframeActuallyLoaded = true;

      // Try to access iframe document (will also fail for cross-origin)
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // eslint-disable-next-line no-console
          console.log('Checkout data forwarder: Iframe content accessible (same-origin)');
        } else {
          // Cross-origin iframe - content not accessible, but iframe loaded
          // eslint-disable-next-line no-console
          console.log('Checkout data forwarder: Iframe loaded successfully (cross-origin, content not accessible - this is normal and expected)');
        }
      } catch (e) {
        // Expected - cross-origin iframe content is not accessible
        // This is normal for cross-origin iframes, doesn't mean it was blocked
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: Iframe loaded successfully (cross-origin, CORS prevents content access - this is normal and expected)');
      }
    });

    // Set a timeout to detect if iframe never loads
    iframeLoadTimeout = setTimeout(() => {
      if (!iframeActuallyLoaded) {
        // eslint-disable-next-line no-console
        console.error('Checkout data forwarder: Iframe load timeout - may be blocked by CSP');
        // Check if iframe is still about:blank (only if same-origin)
        try {
          const currentSrc = iframe.contentWindow?.location?.href || '';
          if (currentSrc === 'about:blank' || !currentSrc) {
            // eslint-disable-next-line no-console
            console.error('Checkout data forwarder: Iframe is about:blank - blocked by CSP frame-ancestors');
            displayErrorMessage(`Payment form cannot be embedded. The iframe was blocked by SnapPay's Content Security Policy. Please contact SnapPay support to whitelist your domain: ${window.location.origin}`);
          }
        } catch (e) {
          // Can't access - cross-origin or CSP blocking
          // Check console for CSP errors instead
          // eslint-disable-next-line no-console
          console.warn('Checkout data forwarder: Cannot verify iframe load status due to CORS. Check browser console for CSP errors. If you see "Refused to frame" error, the iframe is blocked by SnapPay\'s CSP.');
        }
      }
    }, 5000); // 5 second timeout

    iframe.addEventListener('error', (e) => {
      clearTimeout(iframeLoadTimeout);
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Iframe load error event:', e);
      displayErrorMessage('Failed to load payment form. Please check your browser console for details or contact support.');
    });

    // Create hidden input for token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.id = 'snappay_token';
    tokenInput.setAttribute('data-snappay-token', 'true');

    // Create hidden input for card type
    const cardTypeInput = document.createElement('input');
    cardTypeInput.type = 'hidden';
    cardTypeInput.name = 'snappay_card_type';
    cardTypeInput.id = 'snappay_card_type';
    cardTypeInput.setAttribute('data-snappay-card-type', 'true');

    // Create token display container (for debugging/verification)
    const tokenDisplay = document.createElement('div');
    tokenDisplay.className = 'snappay-token-display';
    tokenDisplay.id = 'snappay-token-display';
    tokenDisplay.setAttribute('data-snappay-token-display', 'true');
    tokenDisplay.style.cssText = `
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #e7f5e7;
      border: 1px solid #4caf50;
      border-radius: 4px;
      display: none;
    `;

    const tokenLabel = document.createElement('div');
    tokenLabel.style.cssText = 'font-weight: 600; margin-bottom: 0.5rem; color: #2e7d32;';
    tokenLabel.textContent = 'Payment Token Received:';

    const tokenValue = document.createElement('div');
    tokenValue.id = 'snappay-token-value';
    tokenValue.style.cssText = 'font-family: monospace; font-size: 12px; word-break: break-all; color: #1b5e20;';

    const cardTypeValue = document.createElement('div');
    cardTypeValue.id = 'snappay-card-type-value';
    cardTypeValue.style.cssText = 'font-size: 12px; margin-top: 0.25rem; color: #1b5e20;';

    tokenDisplay.appendChild(tokenLabel);
    tokenDisplay.appendChild(tokenValue);
    tokenDisplay.appendChild(cardTypeValue);

    // Create info message
    const infoMessage = document.createElement('div');
    infoMessage.className = 'snappay-info-message';
    infoMessage.textContent = 'Please enter your payment details in the form below.';
    infoMessage.style.cssText = `
      margin-bottom: 1rem;
      padding: 0.75rem;
      background-color: #e7f3ff;
      border: 1px solid #b3d9ff;
      border-radius: 4px;
      color: #004085;
      font-size: 14px;
    `;

    // Append elements to form
    form.appendChild(iframe);
    form.appendChild(tokenInput);
    form.appendChild(cardTypeInput);

    // Append to container
    state.snapPayContainer.appendChild(infoMessage);
    state.snapPayContainer.appendChild(form);
    state.snapPayContainer.appendChild(tokenDisplay);

    // Append to bank transfer container
    bankTransferContainer.appendChild(state.snapPayContainer);

    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: SnapPay iframe injected with requestid:', sanitizedRequestId);
    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Iframe URL:', url);
    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Iframe attributes:', {
      id: iframe.id,
      name: iframe.name,
      src: iframe.src,
      allow: iframe.allow,
      sandbox: iframe.sandbox,
    });

    // Monitor for CSP violations
    const cspViolationHandler = (e) => {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: CSP violation detected:', {
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        blockedURI: e.blockedURI,
        documentURI: e.documentURI,
        originalPolicy: e.originalPolicy,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        columnNumber: e.columnNumber,
        statusCode: e.statusCode,
      });

      if (e.violatedDirective === 'frame-ancestors'
        || e.effectiveDirective === 'frame-ancestors'
        || e.blockedURI?.includes('snappayglobal.com')) {
        const currentDomain = window.location.origin;
        const errorMsg = `Payment form cannot be embedded due to Content Security Policy restrictions.

SnapPay's server is blocking iframe embedding from your domain: ${currentDomain}

The CSP error shows: "${e.violatedDirective || e.effectiveDirective}"

Please contact SnapPay support and provide:
- Your domain: ${currentDomain}
- Request: Add your domain to their CSP frame-ancestors directive
- Error details: ${JSON.stringify({
    violatedDirective: e.violatedDirective,
    effectiveDirective: e.effectiveDirective,
    blockedURI: e.blockedURI,
  }, null, 2)}`;

        displayErrorMessage(errorMsg);
      }
    };

    // Listen for CSP violations (if browser supports it)
    if (document.addEventListener) {
      document.addEventListener('securitypolicyviolation', cspViolationHandler);
      // Store handler for cleanup
      state.cspViolationHandler = cspViolationHandler;
    }

    // Also check for CSP errors in console by monitoring iframe
    // The browser console will show the actual CSP error, but we can detect it
    // eslint-disable-next-line no-console
    console.warn('Checkout data forwarder: If you see "Refused to frame" error in console, SnapPay\'s CSP is blocking the iframe. Your domain needs to be whitelisted in SnapPay\'s frame-ancestors directive.');
  }

  // Helper function to display error message
  async function displayErrorMessage(message) {
    // Remove existing container if any
    if (state.snapPayContainer) {
      // Clean up CSP violation handler
      if (state.cspViolationHandler) {
        document.removeEventListener('securitypolicyviolation', state.cspViolationHandler);
        state.cspViolationHandler = null;
      }
      state.snapPayContainer.remove();
      state.snapPayContainer = null;
    }

    // Wait for container to be available
    const bankTransferContainer = await waitForBankTransferContainer();
    if (!bankTransferContainer) {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Could not find Bank Transfer payment method container after waiting');
      return;
    }

    // Create error container
    state.snapPayContainer = document.createElement('div');
    state.snapPayContainer.className = 'snappay-error-container';
    state.snapPayContainer.setAttribute('data-snappay-error', 'true');
    state.snapPayContainer.style.marginTop = '1rem';
    state.snapPayContainer.style.padding = '1rem';
    state.snapPayContainer.style.backgroundColor = '#fee';
    state.snapPayContainer.style.border = '1px solid #fcc';
    state.snapPayContainer.style.borderRadius = '4px';
    state.snapPayContainer.style.color = '#c33';

    const errorMessage = document.createElement('div');
    errorMessage.className = 'snappay-error-message';
    errorMessage.textContent = message;
    errorMessage.style.fontWeight = '500';

    state.snapPayContainer.appendChild(errorMessage);
    bankTransferContainer.appendChild(state.snapPayContainer);

    // eslint-disable-next-line no-console
    console.error('Checkout data forwarder: Error message displayed:', message);
  }

  // Helper function to display token on checkout page
  function displayToken(token, cardType) {
    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: displayToken called with:', { token, cardType });

    // Update hidden inputs
    const tokenInput = document.getElementById('snappay_token');
    const cardTypeInput = document.getElementById('snappay_card_type');

    if (tokenInput) {
      tokenInput.value = token;
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Token stored in hidden input:', token);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Checkout data forwarder: Token input element not found (#snappay_token)');
    }

    if (cardTypeInput && cardType) {
      cardTypeInput.value = cardType;
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Card type stored:', cardType);
    }

    // Display token in UI (for debugging/verification)
    // Try multiple ways to find the display element
    let tokenDisplay = document.getElementById('snappay-token-display');
    let tokenValue = document.getElementById('snappay-token-value');
    let cardTypeValue = document.getElementById('snappay-card-type-value');

    // If not found by ID, try to find in the container
    if (!tokenDisplay && state.snapPayContainer) {
      tokenDisplay = state.snapPayContainer.querySelector('#snappay-token-display');
      tokenValue = state.snapPayContainer.querySelector('#snappay-token-value');
      cardTypeValue = state.snapPayContainer.querySelector('#snappay-card-type-value');
    }

    // If still not found, try querySelector
    if (!tokenDisplay) {
      tokenDisplay = document.querySelector('[data-snappay-token-display]');
      tokenValue = document.querySelector('#snappay-token-value');
      cardTypeValue = document.querySelector('#snappay-card-type-value');
    }

    if (tokenDisplay && tokenValue) {
      tokenValue.textContent = `Token: ${token}`;
      if (cardTypeValue && cardType) {
        cardTypeValue.textContent = `Card Type: ${cardType}`;
      }
      tokenDisplay.style.display = 'block';
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Token displayed on checkout page');
    } else {
      // eslint-disable-next-line no-console
      console.error('Checkout data forwarder: Token display element not found. Creating fallback display.');
      // Create a fallback display if element not found
      if (state.snapPayContainer) {
        const fallbackDisplay = document.createElement('div');
        fallbackDisplay.className = 'snappay-token-display-fallback';
        fallbackDisplay.id = 'snappay-token-display';
        fallbackDisplay.style.cssText = `
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #e7f5e7;
          border: 1px solid #4caf50;
          border-radius: 4px;
          display: block;
        `;
        fallbackDisplay.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #2e7d32;">Payment Token Received:</div>
          <div id="snappay-token-value" style="font-family: monospace; font-size: 12px; word-break: break-all; color: #1b5e20;">Token: ${token}</div>
          ${cardType ? `<div id="snappay-card-type-value" style="font-size: 12px; margin-top: 0.25rem; color: #1b5e20;">Card Type: ${cardType}</div>` : ''}
        `;
        state.snapPayContainer.appendChild(fallbackDisplay);
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: Fallback token display created');
      }
    }

    // Store in state
    state.snapPayToken = token;

    // Emit event for other components to use
    events.emit('snappay/token-received', { token, cardType });

    // Hide iframe after token is received (optional - you can keep it visible if needed)
    const iframe = document.getElementById('tokenFrame');
    if (iframe) {
      // Optionally hide the iframe after successful tokenization
      // iframe.style.display = 'none';
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Token received, iframe can be hidden if needed');
    }
  }

  // Setup SnapPay message handler for iframe communication
  function setupSnapPayMessageHandler() {
    // Only set up once
    if (window.snapPayMessageHandlerSetup) {
      return;
    }
    window.snapPayMessageHandlerSetup = true;

    window.addEventListener('message', async (event) => {
      // Trusted origins for SnapPay
      const trustedOrigins = [
        'https://stage.snappayglobal.com',
        'https://www.snappayglobal.com',
        'https://snappayglobal.com',
        'https://cort-uat.cardconnect.com',
        'http://localhost', // For local testing
        'http://127.0.0.1', // For local testing
      ];

      // Log all messages for debugging (before origin check)
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Message event received:', {
        origin: event.origin,
        data: event.data,
        dataType: typeof event.data,
        source: event.source,
      });

      // Validate origin for security
      const isValidOrigin = trustedOrigins.some((origin) => event.origin === origin
        || event.origin.startsWith(origin));
      if (!isValidOrigin) {
        // eslint-disable-next-line no-console
        console.warn('Checkout data forwarder: Message from untrusted origin:', event.origin, 'Data:', event.data);
        // For debugging: temporarily allow all origins (remove in production)
        // eslint-disable-next-line no-console
        console.warn('Checkout data forwarder: Allowing message for debugging purposes - REMOVE IN PRODUCTION');
        // return; // Commented out for debugging - uncomment in production
      }

      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Processing message from trusted origin:', {
        origin: event.origin,
        data: event.data,
        dataType: typeof event.data,
      });

      try {
        // Check if message contains JSON (validation errors)
        if (typeof event.data === 'string' && event.data.includes('message')) {
          try {
            const errorinfo = JSON.parse(event.data);
            const errorMessage = `error: ${errorinfo.error || 'Unknown error'}; message: ${errorinfo.message || 'Unknown message'}`;
            // eslint-disable-next-line no-console
            console.error('Checkout data forwarder: SnapPay validation error:', errorMessage);
            await displayErrorMessage(errorMessage);
          } catch (parseError) {
            // eslint-disable-next-line no-console
            console.warn('Checkout data forwarder: Error parsing error message:', parseError);
          }
        } else if (typeof event.data === 'string') {
          // Check for token in various formats
          // Format 1: "token=abcd1234&type=VISA"
          // Format 2: "token=abcd1234"
          // Format 3: URL-encoded string
          let token = null;
          let cardType = null;

          // eslint-disable-next-line no-console
          console.log('Checkout data forwarder: Processing string message:', event.data);

          if (event.data.includes('token=')) {
            // Parse URL-encoded format: "token=abcd1234&type=VISA"
            const vars = event.data.split('&');
            vars.forEach((pair) => {
              const [key, value] = pair.split('=');
              if (key === 'token' && value) {
                // Decode URL-encoded token
                try {
                  token = decodeURIComponent(value).trim();
                } catch (e) {
                  // If decode fails, use raw value
                  token = value.trim();
                }
              } else if ((key === 'type' || key === 'cardType') && value) {
                // Decode URL-encoded card type
                try {
                  cardType = decodeURIComponent(value).trim();
                } catch (e) {
                  cardType = value.trim();
                }
              }
            });
          } else if (event.data.includes('token')) {
            // Try to parse as JSON string
            try {
              const parsed = JSON.parse(event.data);
              if (parsed.token) {
                token = parsed.token;
                cardType = parsed.type || parsed.cardType;
              }
            } catch (e) {
              // Not JSON, try regex extraction
              const tokenMatch = event.data.match(/token[=:]([^&\s"']+)/i);
              if (tokenMatch && tokenMatch[1]) {
                token = tokenMatch[1].trim();
              }
              const typeMatch = event.data.match(/type[=:]([^&\s"']+)/i);
              if (typeMatch && typeMatch[1]) {
                cardType = typeMatch[1].trim();
              }
            }
          }

          if (token) {
            // Validate token format (basic validation - adjust as needed)
            if (token.length > 0 && token !== 'null' && token !== 'undefined') {
              // eslint-disable-next-line no-console
              console.log('Checkout data forwarder: SnapPay token extracted:', { token, cardType });
              displayToken(token, cardType);
            } else {
              // eslint-disable-next-line no-console
              console.error('Checkout data forwarder: Invalid token format:', token);
              await displayErrorMessage('Invalid token received from payment service. Please try again.');
            }
          } else {
            // eslint-disable-next-line no-console
            console.warn('Checkout data forwarder: Token not found in message. Full data:', event.data);
            // Don't show error for every message that doesn't contain a token
            // await displayErrorMessage(
            //   'Token not received from payment service. Please try again.'
            // );
          }
        } else if (typeof event.data === 'object' && event.data !== null) {
          // Handle object-based messages
          if (event.data.token) {
            const { token, type, cardType } = event.data;
            const finalCardType = type || cardType;
            // eslint-disable-next-line no-console
            console.log('Checkout data forwarder: SnapPay token received (object format):', { token, cardType: finalCardType });
            displayToken(token, finalCardType);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Checkout data forwarder: Error processing SnapPay message:', e);
        await displayErrorMessage(`Error processing payment response: ${e.message || 'Unknown error'}`);
      }
    }, false);
  }

  // Initialize message handler
  setupSnapPayMessageHandler();

  // Helper function to trigger SnapPay HMAC generation and send to App Builder
  async function triggerSnapPayCall(checkoutData) {
    try {
      if (!snapPaySecret || !snapPayAccountId) {
        // eslint-disable-next-line no-console
        console.warn('Checkout data forwarder: skipping HMAC generation – missing SnapPay credentials.');
        return;
      }

      // Extract email from checkout data
      const email = checkoutData?.email
        || checkoutData?.customerEmail
        || state.checkout?.email
        || state.checkout?.customerEmail
        || 'johnsmith@abc.com';

      const { hmacSignature, payload } = await buildSnapPayPayload({
        accountId: snapPayAccountId,
        orderData: checkoutData || state.checkout || {},
      });

      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: HMAC signature:', hmacSignature);
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: payload data (string):', payload);
      try {
        const parsedPayload = JSON.parse(payload);
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: payload data (parsed object):', parsedPayload);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.warn('Checkout data forwarder: Unable to parse payload string into object for logging.', parseError);
      }
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: email for App Builder:', email);

      // Send HMAC signature and payload to App Builder endpoint
      try {
        const response = await fetch(APP_BUILDER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hmacSignature,
            payload,
            accountId: SNAP_PAY_ACCOUNT_ID,
            username: SNAP_PAY_USERNAME,
            password: SNAP_PAY_PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: App Builder full response:', JSON.stringify(responseData, null, 2));

        // Handle response - check both responseData.data and responseData directly
        const responsePayload = responseData?.data || responseData;
        if (!responsePayload) {
          throw new Error('Invalid response structure: missing data field');
        }

        const {
          status, requestid, requestId, message,
        } = responsePayload;
        // Support both requestid and requestId (camelCase)
        const finalRequestId = requestid || requestId;

        // Log full response for debugging
        // eslint-disable-next-line no-console
        console.log('Checkout data forwarder: Response payload:', {
          status,
          requestid,
          requestId,
          finalRequestId,
          requestidType: typeof finalRequestId,
          requestidLength: finalRequestId ? String(finalRequestId).length : 0,
          message,
          fullPayload: responsePayload,
        });

        // Validate requestid before using it
        const isValidRequestId = finalRequestId && (
          typeof finalRequestId === 'string'
          || typeof finalRequestId === 'number'
        ) && String(finalRequestId).trim().length > 0;

        if (status === 'Y' && isValidRequestId) {
          // Success: Inject SnapPay button with requestid
          // eslint-disable-next-line no-console
          console.log('Checkout data forwarder: Status Y, injecting SnapPay button with requestid:', finalRequestId);
          await injectSnapPayIframe(String(finalRequestId).trim());
        } else if (status === 'Y' && !isValidRequestId) {
          // Status Y but invalid requestid
          const errorMessage = `Received success status but invalid request ID: ${finalRequestId}. Please try again.`;
          // eslint-disable-next-line no-console
          console.error('Checkout data forwarder: Status Y but invalid requestid:', {
            requestid,
            requestId,
            finalRequestId,
            isValid: isValidRequestId,
          });
          await displayErrorMessage(errorMessage);
        } else if (status === 'N') {
          // Error: Display message from response
          const errorMessage = message || 'An error occurred while processing your payment request.';
          // eslint-disable-next-line no-console
          console.error('Checkout data forwarder: Status N, displaying error:', errorMessage);
          await displayErrorMessage(errorMessage);
        } else {
          // Unexpected status
          const errorMessage = message || 'Unexpected response status from payment service.';
          // eslint-disable-next-line no-console
          console.error('Checkout data forwarder: Unexpected status, displaying error:', errorMessage);
          await displayErrorMessage(errorMessage);
        }
      } catch (fetchError) {
        // eslint-disable-next-line no-console
        console.error('Checkout data forwarder: Failed to send to App Builder:', fetchError);
        await displayErrorMessage(`Failed to connect to payment service: ${fetchError.message || 'Unknown error'}`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to compute/send SnapPay HMAC signature:', e);
    }
  }

  // Listen for payment method selection - trigger when bank transfer is selected
  events.on('checkout/updated', async (data) => {
    // Update state
    state.checkout = data;

    // Check if bank transfer payment method is selected
    const selectedPaymentMethod = data?.selectedPaymentMethod || data?.paymentMethod;
    const paymentMethodCode = selectedPaymentMethod?.code || selectedPaymentMethod;

    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Payment method updated:', paymentMethodCode);

    // Trigger SnapPay call when bank transfer is selected (only once)
    if (paymentMethodCode === 'banktransfer' && !state.snapPayCallTriggered) {
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Bank Transfer payment method selected - triggering SnapPay call');
      state.snapPayCallTriggered = true;
      await triggerSnapPayCall(data);
    } else if (paymentMethodCode !== 'banktransfer') {
      // Reset flag if a different payment method is selected
      state.snapPayCallTriggered = false;
      // Remove SnapPay container when switching away from bank transfer
      if (state.snapPayContainer) {
        // Clean up CSP violation handler
        if (state.cspViolationHandler) {
          document.removeEventListener('securitypolicyviolation', state.cspViolationHandler);
          state.cspViolationHandler = null;
        }
        state.snapPayContainer.remove();
        state.snapPayContainer = null;
      }
      // Clear token
      state.snapPayToken = null;
    }
  });

  // Also listen to checkout/values event for payment method changes
  events.on('checkout/values', async (values) => {
    const selectedPaymentMethod = values?.selectedPaymentMethod;
    const paymentMethodCode = selectedPaymentMethod?.code || selectedPaymentMethod;

    // eslint-disable-next-line no-console
    console.log('Checkout data forwarder: Checkout values updated, payment method:', paymentMethodCode);

    // Trigger SnapPay call when bank transfer is selected (only once)
    if (paymentMethodCode === 'banktransfer' && !state.snapPayCallTriggered) {
      // eslint-disable-next-line no-console
      console.log('Checkout data forwarder: Bank Transfer payment method selected (from values) - triggering SnapPay call');
      state.snapPayCallTriggered = true;
      await triggerSnapPayCall(state.checkout || {});
    } else if (paymentMethodCode !== 'banktransfer') {
      // Reset flag if a different payment method is selected
      state.snapPayCallTriggered = false;
      // Remove SnapPay container when switching away from bank transfer
      if (state.snapPayContainer) {
        // Clean up CSP violation handler
        if (state.cspViolationHandler) {
          document.removeEventListener('securitypolicyviolation', state.cspViolationHandler);
          state.cspViolationHandler = null;
        }
        state.snapPayContainer.remove();
        state.snapPayContainer = null;
      }
      // Clear token
      state.snapPayToken = null;
    }
  });
}
