# auto-discount Block

## Overview

A module for the Checkout Cart that automatically captures discount codes from URL parameters and applies them to the cart on the checkout page. The module uses the same API (`applyCouponsToCart`) as the manual coupon entry functionality, ensuring identical behavior and no conflicts with default Magento/Adobe Commerce discount functionality.

**Key Requirements Met:**
- ✅ Automatically captures discount code from URL parameter (e.g., `?discount=OFF10`)
- ✅ Uses the same functionality as manual coupon entry
- ✅ Runs only once per checkout session (prevents duplicate application)
- ✅ No conflicts with default Magento/Adobe Commerce discount functionality
- ✅ Follows Magento 2/Adobe Commerce best practices

## Features

- ✅ Automatically detects discount codes from URL parameters
- ✅ Supports multiple URL parameter names (`discount`, `coupon`, `promo`, `code`)
- ✅ Supports multiple comma-separated codes in a single parameter
- ✅ Prevents duplicate application using session storage
- ✅ Integrates with existing `applyCouponsToCart` API
- ✅ Retries automatically if cart is not ready on first attempt
- ✅ Non-intrusive - works in the background without UI changes

## URL Parameter Formats

The module supports multiple URL parameter formats:

### Single Discount Code
```
/cart?discount=OFF10
/cart?coupon=SAVE20
/cart?promo=WELCOME
/cart?code=FREESHIP
```

### Multiple Discount Codes (comma-separated)
```
/cart?discount=OFF10,SAVE20
/cart?coupon=OFF10,WELCOME,FREESHIP
```

### Checkout Page
```
/checkout?discount=OFF10
```

## Integration

### Option 1: Block-Based Integration (Recommended)

Add the block to your cart or checkout page in AEM:

```html
<div class="auto-discount"></div>
```

### Option 2: Script Initialization

Import and initialize in your JavaScript:

```javascript
import autoDiscount from './blocks/auto-discount/auto-discount.js';

// Initialize on page load
autoDiscount();
```

### Option 3: Auto-initialization via scripts.js

Add to `scripts/scripts.js` to auto-initialize on all pages:

```javascript
import { loadBlock } from './aem.js';
import autoDiscount from '../blocks/auto-discount/auto-discount.js';

// Auto-initialize on cart and checkout pages
if (window.location.pathname.includes('/cart') || window.location.pathname.includes('/checkout')) {
  autoDiscount();
}
```

## How It Works

1. **Page Check**: Module only runs on checkout/cart pages (as per requirements)
2. **URL Detection**: Checks URL for discount parameters on page load
3. **Cart Readiness**: Waits for cart to be initialized (listens for `cart/data` event)
4. **Application**: Calls `applyCouponsToCart` API (same API used by manual coupon entry)
5. **Session Tracking**: Stores applied codes in `sessionStorage` to prevent duplicate application
6. **Retry Logic**: If initial attempt fails (cart not ready), retries on cart updates

**Important:** The module uses the official `applyCouponsToCart` API, which is the same API that the Coupons component uses when a user manually enters and applies a discount code. This ensures:
- Identical functionality to manual entry
- No conflicts with existing discount functionality
- Compliance with Magento/Adobe Commerce best practices

## Configuration

The module can be configured by modifying constants in `auto-discount.js`:

```javascript
const STORAGE_KEY = 'auto-discount-checkout-applied';  // Checkout-specific session storage key
const URL_PARAMS = ['discount', 'coupon', 'promo', 'code'];  // Supported URL params
const APPEND_STRATEGY = ApplyCouponsStrategy.APPEND;  // Append vs Replace strategy (APPEND ensures no conflicts)
```

## Session Behavior

- Discount codes are tracked per browser session (checkout-specific)
- Once applied, the same codes won't be applied again in the same checkout session
- Session data is cleared when the browser tab is closed
- This ensures the module runs only once per checkout session (as per requirements)
- Prevents duplicate applications while allowing new codes to be applied

## Error Handling

- If cart is not ready, the module waits and retries
- If API call fails, codes are not marked as applied (allows retry)
- Errors are logged to console for debugging
- Module gracefully handles missing cart data

## Compatibility

- ✅ Works with existing `Coupons` component
- ✅ Compatible with manual coupon entry
- ✅ No conflicts with Magento discount functionality
- ✅ Follows Adobe Commerce Storefront patterns

## Examples

### Example 1: Single Discount Code
```
User visits: /cart?discount=OFF10
Result: OFF10 is automatically applied to cart
```

### Example 2: Multiple Discount Codes
```
User visits: /cart?discount=OFF10,SAVE20
Result: Both OFF10 and SAVE20 are applied
```

### Example 3: Different Parameter Name
```
User visits: /checkout?coupon=WELCOME
Result: WELCOME is automatically applied
```

### Example 4: Already Applied
```
User visits: /cart?discount=OFF10 (first time)
Result: OFF10 applied

User refreshes page or visits again with same code
Result: OFF10 not applied again (already in session)
```

## Testing

1. Add items to cart
2. Visit `/cart?discount=OFF10` (replace OFF10 with your actual discount code)
3. Verify discount is applied automatically
4. Check order summary for discount amount
5. Refresh page - discount should remain but not be applied again

## Files

- `auto-discount.js` - Main module logic
- `auto-discount.css` - Styling (minimal, module is invisible)
- `README.md` - This documentation

## Notes

- The module uses `ApplyCouponsStrategy.APPEND` to add codes without replacing existing ones
- Session storage is used instead of localStorage to clear on tab close
- Module respects existing cart state and applied coupons
- Works with both guest and authenticated user carts

