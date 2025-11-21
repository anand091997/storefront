/* eslint-disable import/no-cycle */
/**
 * Checkout SnapPay Module
 * Adds custom card input fields when SnapPay Payment (Check / Money Order) is selected
 * and intercepts place order to check for interrupt checkout flow.
 *
 * @param {HTMLElement} block
 */
import { events } from '@dropins/tools/event-bus.js';

export default function decorate(block) {
  block.textContent = '';

  const state = {
    cardFieldsContainer: null,
    isSnapPaySelected: false,
    originalPlaceOrderHandler: null,
  };

  // Card field references
  let cardNumberInput = null;
  let expirationInput = null;
  let cvvInput = null;

  /**
   * Find the Check / Money Order (SnapPay Payment) payment method container
   * @returns {HTMLElement|null} The payment method container
   */
  function findSnapPayContainer() {
    // Try multiple selectors to find the check/money order payment method
    const selectors = [
      '[data-payment-method-code="checkmo"]',
      'input[type="radio"][value="checkmo"]',
      'input[type="radio"][name*="payment"][value*="checkmo"]',
    ];

    const foundElement = selectors
      .map((selector) => document.querySelector(selector))
      .find((element) => element !== null);

    if (foundElement) {
      // Find the parent container that holds the payment method content
      const container = foundElement.closest('.payment-method, .checkout-payment-method, [class*="payment"], [class*="PaymentMethod"]') || foundElement.parentElement;
      if (container) {
        return container;
      }
    }

    // Fallback: find payment methods container
    const paymentMethodsContainer = document.querySelector(
      '.checkout__payment-methods, [class*="payment-methods"], [class*="PaymentMethods"]',
    );
    return paymentMethodsContainer;
  }

  /**
   * Create card input fields container
   * @returns {HTMLElement} The card fields container
   */
  function createCardFieldsContainer() {
    const container = document.createElement('div');
    container.className = 'checkout-snappay__card-fields';

    // Card Number Field
    const cardNumberGroup = document.createElement('div');
    cardNumberGroup.className = 'checkout-snappay__field-group';

    const cardNumberLabel = document.createElement('label');
    cardNumberLabel.className = 'checkout-snappay__label';
    cardNumberLabel.setAttribute('for', 'snappay-card-number');
    cardNumberLabel.textContent = 'Credit Card Number';

    cardNumberInput = document.createElement('input');
    cardNumberInput.type = 'text';
    cardNumberInput.id = 'snappay-card-number';
    cardNumberInput.className = 'checkout-snappay__input';
    cardNumberInput.placeholder = 'CC Number';
    cardNumberInput.maxLength = 16;
    cardNumberInput.required = true;
    cardNumberInput.setAttribute('autocomplete', 'cc-number');

    const cardNumberError = document.createElement('div');
    cardNumberError.className = 'checkout-snappay__error';
    cardNumberError.setAttribute('role', 'alert');
    cardNumberError.style.display = 'none';

    cardNumberGroup.appendChild(cardNumberLabel);
    cardNumberGroup.appendChild(cardNumberInput);
    cardNumberGroup.appendChild(cardNumberError);

    // Expiration Date Field
    const expirationGroup = document.createElement('div');
    expirationGroup.className = 'checkout-snappay__field-group';

    const expirationLabel = document.createElement('label');
    expirationLabel.className = 'checkout-snappay__label';
    expirationLabel.setAttribute('for', 'snappay-expiration');
    expirationLabel.textContent = 'Expiration Date';

    expirationInput = document.createElement('input');
    expirationInput.type = 'text';
    expirationInput.id = 'snappay-expiration';
    expirationInput.className = 'checkout-snappay__input';
    expirationInput.placeholder = 'MM/YY';
    expirationInput.maxLength = 5;
    expirationInput.required = true;
    expirationInput.setAttribute('autocomplete', 'cc-exp');

    const expirationError = document.createElement('div');
    expirationError.className = 'checkout-snappay__error';
    expirationError.setAttribute('role', 'alert');
    expirationError.style.display = 'none';

    expirationGroup.appendChild(expirationLabel);
    expirationGroup.appendChild(expirationInput);
    expirationGroup.appendChild(expirationError);

    // CVV Field
    const cvvGroup = document.createElement('div');
    cvvGroup.className = 'checkout-snappay__field-group';

    const cvvLabel = document.createElement('label');
    cvvLabel.className = 'checkout-snappay__label';
    cvvLabel.setAttribute('for', 'snappay-cvv');
    cvvLabel.textContent = 'CVV';

    cvvInput = document.createElement('input');
    cvvInput.type = 'text';
    cvvInput.id = 'snappay-cvv';
    cvvInput.className = 'checkout-snappay__input';
    cvvInput.placeholder = 'CVV';
    cvvInput.maxLength = 3;
    cvvInput.required = true;
    cvvInput.setAttribute('autocomplete', 'cc-csc');

    const cvvError = document.createElement('div');
    cvvError.className = 'checkout-snappay__error';
    cvvError.setAttribute('role', 'alert');
    cvvError.style.display = 'none';

    cvvGroup.appendChild(cvvLabel);
    cvvGroup.appendChild(cvvInput);
    cvvGroup.appendChild(cvvError);

    // Append all field groups
    container.appendChild(cardNumberGroup);
    container.appendChild(expirationGroup);
    container.appendChild(cvvGroup);

    // Add input event listeners for formatting and validation
    setupInputHandlers();

    return container;
  }

  /**
   * Setup input handlers for formatting and validation
   */
  function setupInputHandlers() {
    // Card number: only digits, max 16
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
        clearError(cardNumberInput);
      });
    }

    // Expiration: format as MM/YY
    if (expirationInput) {
      expirationInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
        }
        e.target.value = value;
        clearError(expirationInput);
      });
    }

    // CVV: only digits, max 3
    if (cvvInput) {
      cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
        clearError(cvvInput);
      });
    }
  }

  /**
   * Show error message for a field
   * @param {HTMLElement} input - The input element
   * @param {string} message - Error message
   */
  function showError(input, message) {
    const errorElement = input.parentElement.querySelector('.checkout-snappay__error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      input.setAttribute('aria-invalid', 'true');
      input.classList.add('checkout-snappay__input--error');
    }
  }

  /**
   * Clear error message for a field
   * @param {HTMLElement} input - The input element
   */
  function clearError(input) {
    const errorElement = input.parentElement.querySelector('.checkout-snappay__error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
      input.removeAttribute('aria-invalid');
      input.classList.remove('checkout-snappay__input--error');
    }
  }

  /**
   * Validate card number (exactly 16 digits)
   * @param {string} cardNumber - Card number to validate
   * @returns {boolean} True if valid
   */
  function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    return cleaned.length === 16 && /^\d{16}$/.test(cleaned);
  }

  /**
   * Validate expiration date (future date in MM/YY format)
   * @param {string} expiration - Expiration date to validate
   * @returns {boolean} True if valid
   */
  function validateExpiration(expiration) {
    const match = expiration.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  }

  /**
   * Validate CVV (exactly 3 digits)
   * @param {string} cvv - CVV to validate
   * @returns {boolean} True if valid
   */
  function validateCVV(cvv) {
    const cleaned = cvv.replace(/\D/g, '');
    return cleaned.length === 3 && /^\d{3}$/.test(cleaned);
  }

  /**
   * Validate all card fields
   * @returns {boolean} True if all fields are valid
   */
  function validateCardFields() {
    let isValid = true;

    // Validate card number
    if (!cardNumberInput || !validateCardNumber(cardNumberInput.value)) {
      if (cardNumberInput) {
        showError(cardNumberInput, 'Card number must be exactly 16 digits');
      }
      isValid = false;
    }

    // Validate expiration
    if (!expirationInput || !validateExpiration(expirationInput.value)) {
      if (expirationInput) {
        showError(expirationInput, 'Expiration date must be a valid future date (MM/YY)');
      }
      isValid = false;
    }

    // Validate CVV
    if (!cvvInput || !validateCVV(cvvInput.value)) {
      if (cvvInput) {
        showError(cvvInput, 'CVV must be exactly 3 digits');
      }
      isValid = false;
    }

    return isValid;
  }

  /**
   * Show card fields when SnapPay is selected
   */
  function showCardFields() {
    if (state.cardFieldsContainer && state.cardFieldsContainer.parentElement) {
      return; // Already shown
    }

    const snapPayContainer = findSnapPayContainer();
    if (!snapPayContainer) {
      // eslint-disable-next-line no-console
      console.warn('[Checkout SnapPay] Could not find Check / Money Order payment method container');
      return;
    }

    if (!state.cardFieldsContainer) {
      state.cardFieldsContainer = createCardFieldsContainer();
    }

    // Find the SnapPay Payment span with class dropin-toggle-button__content
    const snapPayTitleSpan = snapPayContainer.querySelector('span.dropin-toggle-button__content');

    if (snapPayTitleSpan) {
      // Find the parent toggle button container
      const toggleButtonContainer = snapPayTitleSpan.closest('.dropin-toggle-button');

      if (toggleButtonContainer) {
        // Insert card fields inside the toggle button container, after the content span
        // This ensures the title appears at the top beside the radio button
        if (snapPayTitleSpan.nextSibling) {
          toggleButtonContainer.insertBefore(
            state.cardFieldsContainer,
            snapPayTitleSpan.nextSibling,
          );
        } else {
          toggleButtonContainer.appendChild(state.cardFieldsContainer);
        }
      } else if (snapPayTitleSpan.nextSibling) {
        // If toggle button container not found, insert after the span itself
        snapPayTitleSpan.parentElement.insertBefore(
          state.cardFieldsContainer,
          snapPayTitleSpan.nextSibling,
        );
      } else {
        snapPayTitleSpan.parentElement.appendChild(state.cardFieldsContainer);
      }
    } else {
      // Fallback: Find the payment method item container
      const radioButton = snapPayContainer.querySelector('input[type="radio"][value="checkmo"]');
      if (!radioButton) {
        snapPayContainer.appendChild(state.cardFieldsContainer);
      } else {
        // Find the payment method item wrapper
        let paymentMethodItem = radioButton.closest('label');
        if (!paymentMethodItem) {
          paymentMethodItem = radioButton.closest('[class*="payment-method"], [class*="PaymentMethod"]');
        }
        if (!paymentMethodItem) {
          paymentMethodItem = radioButton.parentElement;
        }

        // Insert after the payment method item
        if (paymentMethodItem && paymentMethodItem.parentElement) {
          if (paymentMethodItem.nextSibling) {
            paymentMethodItem.parentElement.insertBefore(
              state.cardFieldsContainer,
              paymentMethodItem.nextSibling,
            );
          } else {
            paymentMethodItem.parentElement.appendChild(state.cardFieldsContainer);
          }
        } else {
          snapPayContainer.appendChild(state.cardFieldsContainer);
        }
      }
    }

    state.isSnapPaySelected = true;
  }

  /**
   * Hide card fields when SnapPay is not selected
   */
  function hideCardFields() {
    if (state.cardFieldsContainer && state.cardFieldsContainer.parentElement) {
      state.cardFieldsContainer.remove();
    }
    state.isSnapPaySelected = false;
  }

  /**
   * Show modal popup with interrupt checkout message
   */
  function showInterruptCheckoutModal() {
    // Remove existing modal if present
    const existingModal = document.querySelector('.checkout-snappay__modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'checkout-snappay__modal-overlay';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.setAttribute('aria-labelledby', 'checkout-snappay-modal-title');

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'checkout-snappay__modal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'checkout-snappay__modal-content';

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'checkout-snappay__modal-icon';
    iconContainer.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>';

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'checkout-snappay__modal-message';
    messageContainer.textContent = 'All Debit Card transactions require a credit verification before your order can be finalized and delivery can be made. An additional Security Deposit amount may be required.';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'checkout-snappay__modal-close';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      modalOverlay.remove();
      document.body.style.overflow = '';
    });

    // Assemble modal
    modalContent.appendChild(iconContainer);
    modalContent.appendChild(messageContainer);
    modal.appendChild(closeButton);
    modal.appendChild(modalContent);
    modalOverlay.appendChild(modal);

    // Add to body
    document.body.appendChild(modalOverlay);
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
        document.body.style.overflow = '';
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modalOverlay.parentElement) {
        modalOverlay.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Intercept place order to check for interrupt checkout
   * @param {Event} event - The click event
   * @returns {boolean} False if order should be prevented
   */
  function interceptPlaceOrder(event) {
    // Only intercept if SnapPay is selected
    if (!state.isSnapPaySelected) {
      return true; // Allow normal flow
    }

    // Validate card fields first
    if (!validateCardFields()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Scroll to first error
      const firstError = document.querySelector('.checkout-snappay__input--error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return false;
    }

    // Get card number
    const cardNumber = cardNumberInput ? cardNumberInput.value.replace(/\D/g, '') : '';

    // Check if card ends with 5454
    if (cardNumber.endsWith('5454')) {
      // Allow normal order placement for card ending with 5454
      return true;
    }

    // For any other card number, show modal and prevent order placement
    showInterruptCheckoutModal();
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }

  /**
   * Setup place order button interception
   */
  function setupPlaceOrderInterception() {
    // Find place order button
    const findPlaceOrderButton = () => {
      const selectors = [
        'button[type="submit"]',
        '.checkout__place-order button',
        '[class*="place-order"] button',
        '[class*="PlaceOrder"] button',
      ];

      const foundButton = selectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .find((button) => button.textContent.trim().toLowerCase().includes('place order'));

      return foundButton || null;
    };

    // Intercept at document level for better capture
    const handleDocumentClick = (event) => {
      const { target } = event;
      if (target && target.tagName === 'BUTTON' && target.textContent.trim().toLowerCase().includes('place order')) {
        interceptPlaceOrder(event);
      }
    };

    // Add capture phase listener to document
    document.addEventListener('click', handleDocumentClick, true);

    // Also try to find and intercept button directly
    const tryInterceptButton = () => {
      const placeOrderButton = findPlaceOrderButton();
      if (placeOrderButton && !placeOrderButton.dataset.snappayIntercepted) {
        placeOrderButton.dataset.snappayIntercepted = 'true';
        placeOrderButton.addEventListener('click', interceptPlaceOrder, true);
      }
    };

    // Try immediately
    tryInterceptButton();

    // If not found, wait for it to be rendered
    const observer = new MutationObserver(() => {
      tryInterceptButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also try after delays
    setTimeout(tryInterceptButton, 500);
    setTimeout(tryInterceptButton, 1000);
    setTimeout(tryInterceptButton, 2000);
  }

  // Listen for payment method selection changes
  events.on('checkout/updated', (data) => {
    const selectedPaymentMethod = data?.selectedPaymentMethod || data?.paymentMethod;
    const paymentMethodCode = selectedPaymentMethod?.code || selectedPaymentMethod;

    if (paymentMethodCode === 'checkmo') {
      // Wait a bit for DOM to update, then show fields
      setTimeout(() => {
        showCardFields();
      }, 100);
    } else {
      hideCardFields();
    }
  });

  // Also listen to checkout/values event
  events.on('checkout/values', (values) => {
    const selectedPaymentMethod = values?.selectedPaymentMethod;
    const paymentMethodCode = selectedPaymentMethod?.code || selectedPaymentMethod;

    if (paymentMethodCode === 'checkmo') {
      setTimeout(() => {
        showCardFields();
      }, 100);
    } else {
      hideCardFields();
    }
  });

  // Setup place order interception
  setupPlaceOrderInterception();

  // Also listen for radio button changes directly (as fallback)
  document.addEventListener('change', (event) => {
    if (event.target.type === 'radio' && event.target.name && event.target.name.includes('payment')) {
      if (event.target.value === 'checkmo') {
        setTimeout(() => {
          showCardFields();
        }, 100);
      } else {
        hideCardFields();
      }
    }
  });
}
