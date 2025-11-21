/* eslint-disable import/no-cycle */
/**
 * External API Call block
 * Renders a button that calls an external API and displays the response in a toggle message.
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const API_ENDPOINT = 'https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/external-apicall';
  const TOAST_DURATION = 5000; // 5 seconds

  // Create container
  const container = document.createElement('div');
  container.className = 'external-apicall__container';

  // Create message container (for displaying API response)
  const messageContainer = document.createElement('div');
  messageContainer.className = 'external-apicall__message';
  messageContainer.style.display = 'none';

  // Create button
  const button = document.createElement('button');
  button.className = 'external-apicall__button';
  button.type = 'button';
  button.textContent = 'Make the API Call';

  // Append message container and button to container
  container.append(messageContainer, button);
  block.textContent = '';
  block.append(container);

  /**
   * Format API response as key-value pairs string
   * @param {Object} response - API response object
   * @returns {string} - Formatted string with key-value pairs
   */
  function formatResponse(response) {
    if (!response || typeof response !== 'object') {
      return 'Invalid response format';
    }

    const pairs = Object.entries(response)
      .map(([key, value]) => `${key} = ${value}`)
      .join('\n');

    return pairs;
  }

  /**
   * Show toggle message above the button
   * @param {string} message - Message to display
   * @param {string} type - Type of message: 'success' or 'error'
   */
  function showMessage(message, type = 'success') {
    // Clear any existing message
    messageContainer.innerHTML = '';
    messageContainer.className = `external-apicall__message external-apicall__message--${type}`;
    messageContainer.setAttribute('role', 'alert');
    messageContainer.setAttribute('aria-live', 'assertive');

    // Format message with line breaks for key-value pairs
    const messageLines = message.split('\n');
    const messageContent = document.createElement('div');
    messageContent.className = 'external-apicall__message-content';
    messageLines.forEach((line) => {
      const lineElement = document.createElement('div');
      lineElement.textContent = line;
      messageContent.appendChild(lineElement);
    });
    messageContainer.appendChild(messageContent);

    // Show message with animation
    messageContainer.style.display = 'block';
    setTimeout(() => {
      messageContainer.classList.add('external-apicall__message--show');
    }, 10);

    // Hide message after duration
    setTimeout(() => {
      messageContainer.classList.remove('external-apicall__message--show');
      setTimeout(() => {
        messageContainer.style.display = 'none';
        messageContainer.innerHTML = '';
      }, 300); // Wait for fade-out animation
    }, TOAST_DURATION);
  }

  /**
   * Enable button loading state
   */
  function enableButtonLoading() {
    button.disabled = true;
    button.classList.add('external-apicall__button--loading');
    button.textContent = 'Calling API...';
  }

  /**
   * Disable button loading state
   */
  function disableButtonLoading() {
    button.disabled = false;
    button.classList.remove('external-apicall__button--loading');
    button.textContent = 'Make the API Call';
  }

  /**
   * Call external API
   * @returns {Promise<Object>} - API response
   */
  async function callExternalAPI() {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[External-APICall] API call failed:', error);
      throw error;
    }
  }

  // Handle button click
  button.addEventListener('click', async () => {
    // Disable button and show loading state
    enableButtonLoading();

    try {
      // Call external API
      const response = await callExternalAPI();

      // Log response to console with prefix
      // eslint-disable-next-line no-console
      console.log('[External-APICall] API Response:', response);

      // Format and display response
      const formattedMessage = formatResponse(response);
      showMessage(formattedMessage, 'success');
    } catch (error) {
      const errorMsg = 'Failed to call API. Please try again later.';
      showMessage(errorMsg, 'error');
      // eslint-disable-next-line no-console
      console.error('[External-APICall] Error:', error.message || errorMsg);
    } finally {
      // Re-enable button
      disableButtonLoading();
    }
  });
}
