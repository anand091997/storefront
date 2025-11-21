# checkout-snappay Block

A checkout module that adds custom card input fields when SnapPay Payment (Check / Money Order) is selected and intercepts the place order flow for interrupt checkout handling.

## Features

- ✅ Automatically shows card input fields when SnapPay Payment is selected
- ✅ Hides card fields when other payment methods are selected
- ✅ Card number validation (exactly 16 digits)
- ✅ Expiration date validation (future date in MM/YY format)
- ✅ CVV validation (exactly 3 digits)
- ✅ Real-time input formatting and validation
- ✅ Place order interception for interrupt checkout flow
- ✅ Card number ending with 5454 triggers interrupt alert
- ✅ All other card numbers proceed with normal Check / Money Order order placement

## Usage

### In AEM Document Authoring

1. Navigate to the checkout page
2. Insert a new block
3. Add the class: `checkout-snappay`

The module will automatically:
- Listen for payment method selection changes
- Show/hide card fields based on SnapPay Payment selection
- Intercept place order button clicks
- Validate card fields before order placement

### HTML Structure

```html
<div class="checkout-snappay block"></div>
```

## Payment Method Integration

The module works with the **Check / Money Order** payment method, which is displayed as **SnapPay Payment** on the frontend.

- **Internal Payment Code**: `checkmo`
- **Frontend Display**: SnapPay Payment
- **Behavior**: Functions as Check / Money Order payment method internally

## Card Fields

When SnapPay Payment is selected, the following fields are displayed:

1. **Credit Card Number**
   - Placeholder: "CC Number"
   - Validation: Exactly 16 digits
   - Auto-formats to digits only

2. **Expiration Date**
   - Placeholder: "MM/YY"
   - Validation: Future date in MM/YY format
   - Auto-formats as user types

3. **CVV**
   - Placeholder: "CVV"
   - Validation: Exactly 3 digits
   - Auto-formats to digits only

## Validation Rules

### Card Number
- Must be exactly 16 digits
- Only numeric characters allowed
- Shows error if invalid

### Expiration Date
- Must be in MM/YY format
- Month must be between 01-12
- Must be a future date (not expired)
- Shows error if invalid or expired

### CVV
- Must be exactly 3 digits
- Only numeric characters allowed
- Shows error if invalid

## Place Order Interception

When the user clicks **Place Order**:

1. **Validation Check**: All card fields are validated first
   - If validation fails, order placement is prevented
   - Error messages are displayed

2. **Interrupt Checkout**: If card number ends with **5454**
   - Alert is shown: "Interrupt checkout initiate"
   - Order placement is prevented (returns false)
   - This allows for future API calls to be added

3. **Normal Flow**: For any other card number
   - Order proceeds normally using Check / Money Order logic
   - Standard checkout flow continues

## Event Listeners

The module listens to the following events:

- `checkout/updated` - Detects payment method selection changes
- `checkout/values` - Alternative event for payment method changes
- Radio button change events (fallback)

## Files

- `checkout-snappay.js` - Main module logic with payment detection, field injection, validation, and order interception
- `checkout-snappay.css` - Styling for card input fields and error messages
- `README.md` - This documentation

## Future Enhancements

The module structure is designed to support additional API calls during the interrupt checkout flow. When a card ending with 5454 is detected, you can extend the `interceptPlaceOrder` function to:

- Make API calls before showing the alert
- Collect additional data
- Perform custom validation
- Integrate with external services

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (async/await, arrow functions)
- Requires Adobe Storefront event bus

## Accessibility

- Proper label associations
- ARIA attributes for error messages
- Keyboard navigation support
- Screen reader friendly

