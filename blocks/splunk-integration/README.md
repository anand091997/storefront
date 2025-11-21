# splunk-integration Block

A reusable block that provides a form interface for sending messages to the Splunk API. The module includes input validation, loading states, error handling, and toast notifications.

## Features

- ✅ Text input for entering messages
- ✅ Submit button with loading state
- ✅ Input validation (prevents empty submissions)
- ✅ API integration with Splunk endpoint
- ✅ Toast notifications for success/error messages
- ✅ Automatic toast dismissal after 5 seconds
- ✅ Console logging for debugging
- ✅ Disabled button state during API calls (prevents duplicate submissions)
- ✅ User-friendly error messages
- ✅ Accessible (ARIA attributes)
- ✅ Responsive design

## Usage

### In AEM Document Authoring

1. Navigate to the page where you want to add the Splunk Integration module
2. Insert a new block
3. Add the class: `splunk-integration`

The block will automatically render the form with all functionality.

### HTML Structure

```html
<div class="splunk-integration block"></div>
```

## API Integration

The module sends POST requests to:
```
POST https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/splunk-sender
```

**Request Format:**
```json
{
  "data": {
    "token": "Splunk 1f06674e-19af-4e46-8729-a3f2d1be71b0",
    "message": "<message_from_textbox>"
  }
}
```

**Response Format:**
```json
{
  "code": 0,
  "text": "Success"
}
```

## Behavior

### Success Flow
1. User enters message and clicks Submit
2. Button shows loading state ("Submitting...")
3. API call is made
4. On success (code: 0):
   - Toast notification appears with success message
   - Message is logged to console
   - Input field is cleared
   - Button returns to normal state

### Error Flow
1. User enters message and clicks Submit
2. Button shows loading state
3. If API call fails or returns error:
   - Toast notification appears with error message
   - Error message appears below input field
   - Error is logged to console
   - Button returns to normal state

### Validation
- Empty input validation
- Visual error indication on input field
- Error message displayed below input
- Error clears when user starts typing

## Toast Notifications

- Appears in top-right corner of screen
- Automatically dismisses after 5 seconds
- Supports success (green) and error (red) types
- Multiple toasts can stack vertically
- Responsive: adapts to mobile screens

## Console Logging

All operations are logged to the browser console:
- Success messages: `console.log('[Splunk Integration] Success:', message)`
- Error messages: `console.error('[Splunk Integration] Error:', error)`
- Validation errors: `console.error('[Splunk Integration] Validation error:', message)`

## Files

- `splunk-integration.js` - Main module logic with form handling and API integration
- `splunk-integration.css` - Styling for form, button, error messages, and toast notifications
- `README.md` - This documentation

## Configuration

To modify the API endpoint or token, edit the constants in `splunk-integration.js`:

```javascript
const API_ENDPOINT = 'https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/splunk-sender';
const SPLUNK_TOKEN = 'Splunk 1f06674e-19af-4e46-8729-a3f2d1be71b0';
const TOAST_DURATION = 5000; // 5 seconds
```

## Accessibility

- Proper label associations
- ARIA attributes for error messages and toasts
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (async/await, fetch API)
- No external dependencies

## Testing

1. Add the block to a page
2. Enter a message in the text box
3. Click Submit
4. Verify:
   - Button shows loading state
   - Toast appears with success message
   - Console shows success log
   - Input is cleared
5. Test error handling:
   - Disconnect network or modify API endpoint
   - Submit form
   - Verify error toast and error message appear
6. Test validation:
   - Try submitting empty form
   - Verify error message appears
   - Start typing to verify error clears

