# external-apicall Block

A reusable block that provides a button interface for calling an external API. The module includes loading states, error handling, and toggle message notifications.

## Features

- ✅ Button to trigger API call
- ✅ Loading state during API call
- ✅ Toggle message (toast) notification for API response
- ✅ Automatic message dismissal after 5 seconds
- ✅ Console logging with [External-APICall] prefix
- ✅ Displays key-value pairs from API response
- ✅ Disabled button state during API calls (prevents duplicate submissions)
- ✅ User-friendly error messages
- ✅ Accessible (ARIA attributes)
- ✅ Responsive design

## Usage

### In AEM Document Authoring

1. Navigate to the page where you want to add the External API Call module
2. Insert a new block
3. Add the class: `external-apicall`

The block will automatically render the button with all functionality.

### HTML Structure

```html
<div class="external-apicall block"></div>
```

## API Integration

The module sends GET requests to:
```
GET https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/external-apicall
```

**Request Format:**
- Method: GET
- No headers or body required

**Response Format:**
```json
{
  "Status": "OK",
  "statusCode": 200
}
```

## Behavior

### Success Flow
1. User clicks "Make the API Call" button
2. Button shows loading state ("Calling API...")
3. API call is made using GET method
4. On success:
   - Toggle message appears displaying key-value pairs from response
   - Response is logged to console with [External-APICall] prefix
   - Message automatically disappears after 5 seconds
   - Button returns to normal state

### Error Flow
1. User clicks "Make the API Call" button
2. Button shows loading state
3. If API call fails:
   - Error message appears in toggle message
   - Error is logged to console with [External-APICall] prefix
   - Message automatically disappears after 5 seconds
   - Button returns to normal state

## Toggle Message Display

The toggle message displays API response data as key-value pairs:
- Each key-value pair is shown on a separate line
- Format: `Key = Value`
- Example:
  ```
  Status Code = 200
  Status = OK
  ```

## Console Logging

All operations are logged to the browser console with the prefix `[External-APICall]`:
- Success responses: `console.log('[External-APICall] API Response:', response)`
- Error messages: `console.error('[External-APICall] Error:', error)`
- API call failures: `console.error('[External-APICall] API call failed:', error)`

## Files

- `external-apicall.js` - Main module logic with API call handling and toggle message display
- `external-apicall.css` - Styling for button, loading states, and toggle message notifications
- `README.md` - This documentation

## Configuration

To modify the API endpoint or toast duration, edit the constants in `external-apicall.js`:

```javascript
const API_ENDPOINT = 'https://1244026-274burgundyparrot-stage.adobeioruntime.net/api/v1/web/cortpoc/external-apicall';
const TOAST_DURATION = 5000; // 5 seconds
```

## Accessibility

- Proper ARIA attributes for toggle messages
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (async/await, fetch API)
- No external dependencies

## CSS Class Name

To render this button in your document, use the following CSS class:

**`external-apicall`**

Example:
```html
<div class="external-apicall block"></div>
```

