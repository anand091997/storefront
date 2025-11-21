/* eslint-disable import/no-cycle */
/**
 * Splunk Integration block
 * Renders a form with a textarea and submit button that sends messages to Splunk API.
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const API_ENDPOINT = 'https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/splunk-sender';
  const SPLUNK_TOKEN = 'Splunk 1f06674e-19af-4e46-8729-a3f2d1be71b0';
  const TOAST_DURATION = 5000; // 5 seconds

  // Create form container
  const form = document.createElement('form');
  form.className = 'splunk-integration__form';

  // Create label
  const label = document.createElement('label');
  label.className = 'splunk-integration__label';
  label.setAttribute('for', 'splunk-integration-textarea');
  label.textContent = 'Enter message:';

  // Create textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'splunk-integration__textarea';
  textarea.id = 'splunk-integration-textarea';
  textarea.name = 'message';
  textarea.placeholder = 'Type your message...';
  textarea.rows = 4;
  textarea.required = true;

  // Create submit button
  const button = document.createElement('button');
  button.className = 'splunk-integration__button';
  button.type = 'submit';
  button.textContent = 'Submit';

  // Create error message container
  const errorMessage = document.createElement('div');
  errorMessage.className = 'splunk-integration__error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.setAttribute('aria-live', 'polite');
  errorMessage.style.display = 'none';

  // Create toast container (will be appended to body)
  let toastContainer = document.querySelector('.splunk-integration__toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'splunk-integration__toast-container';
    document.body.appendChild(toastContainer);
  }

  // Append form elements
  form.append(label, textarea, button, errorMessage);
  block.textContent = '';
  block.append(form);

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast: 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `splunk-integration__toast splunk-integration__toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('splunk-integration__toast--show');
    }, 10);

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('splunk-integration__toast--show');
      setTimeout(() => {
        toast.remove();
      }, 300); // Wait for fade-out animation
    }, TOAST_DURATION);
  }

  /**
   * Show error message in form
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    textarea.setAttribute('aria-invalid', 'true');
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorMessage.style.display = 'none';
    textarea.removeAttribute('aria-invalid');
  }

  /**
   * Enable button loading state
   */
  function enableButtonLoading() {
    button.disabled = true;
    button.classList.add('splunk-integration__button--loading');
    button.textContent = 'Submitting...';
  }

  /**
   * Disable button loading state
   */
  function disableButtonLoading() {
    button.disabled = false;
    button.classList.remove('splunk-integration__button--loading');
    button.textContent = 'Submit';
  }

  /**
   * Send message to Splunk API
   * @param {string} message - Message to send
   * @returns {Promise<Object>} - API response
   */
  async function sendToSplunk(message) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            token: SPLUNK_TOKEN,
            message,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Splunk Integration] API call failed:', error);
      throw error;
    }
  }

  // Handle form submission
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    const message = textarea.value.trim();

    // Validate input
    if (!message) {
      const errorMsg = 'Please enter a message before submitting.';
      showError(errorMsg);
      // eslint-disable-next-line no-console
      console.error('[Splunk Integration] Validation error:', errorMsg);
      textarea.focus();
      return;
    }

    // Log the entered message before calling API
    // eslint-disable-next-line no-console
    console.log('[Splunk Integration] Entered message:', message);

    // Disable button and show loading state
    enableButtonLoading();

    try {
      // Send to Splunk API
      const response = await sendToSplunk(message);

      // Handle response
      if (response?.code === 0) {
        const successMessage = response?.text || 'Success';
        showToast(successMessage, 'success');
        // eslint-disable-next-line no-console
        console.log('[Splunk Integration] Success:', successMessage);
        // Log the response message (text value)
        // eslint-disable-next-line no-console
        console.log('[Splunk Integration] Response message:', response?.text || 'Success');
        // Clear textarea on success
        textarea.value = '';
      } else {
        const errorMsg = response?.text || 'An error occurred while sending the message.';
        showToast(errorMsg, 'error');
        showError(errorMsg);
        // eslint-disable-next-line no-console
        console.error('[Splunk Integration] API error:', errorMsg);
        // Log the response message even on error
        // eslint-disable-next-line no-console
        console.log('[Splunk Integration] Response message:', response?.text || errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to send message. Please try again later.';
      showToast(errorMsg, 'error');
      showError(errorMsg);
      // eslint-disable-next-line no-console
      console.error('[Splunk Integration] Error:', error.message || errorMsg);
    } finally {
      // Re-enable button
      disableButtonLoading();
    }
  });

  // Clear error when user starts typing
  textarea.addEventListener('input', () => {
    if (errorMessage.style.display === 'block') {
      hideError();
    }
  });
}
