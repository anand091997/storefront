# customer-segment-content Block

## Overview

A dynamic content block that displays personalized content based on customer segments retrieved via Adobe Commerce GraphQL API. The block automatically adapts content (banner images, text, HTML) based on the customer's assigned segments or group UID.

## Integration

### Block Configuration

The block uses configuration keys to map segment UIDs or group UIDs to specific content. Configuration is read via `readBlockConfig()` from the block's section metadata.

| Configuration Key | Type | Default | Description | Required |
|-------------------|------|---------|-------------|----------|
| `segment-{segmentUid}-banner-image` | string | - | Image URL for banner when segment matches | No |
| `segment-{segmentUid}-banner-image-alt` | string | - | Alt text for banner image | No |
| `segment-{segmentUid}-text-content` | string | - | Text content to display | No |
| `segment-{segmentUid}-html-content` | string | - | HTML content to inject | No |
| `segment-{segmentUid}-show-elements` | string | - | CSS selector for elements to show | No |
| `segment-{segmentUid}-hide-elements` | string | - | CSS selector for elements to hide | No |
| `group-{groupUid}-banner-image` | string | - | Image URL for banner when group matches | No |
| `group-{groupUid}-text-content` | string | - | Text content for customer group | No |
| `require-auth` | string | `'false'` | Hide block if user not authenticated | No |
| `hide-if-no-match` | string | `'false'` | Hide block if no segment matches | No |
| `debug` | string | `'false'` | Show debug information | No |

### Example Configuration

In AEM/Franklin, configure via section metadata:

```
segment-premium-banner-image: https://example.com/premium-banner.jpg
segment-premium-text-content: Welcome, Premium Member!
segment-premium-html-content: <div class="premium-offer">Special Offer!</div>
group-MTIwMTYtMg-banner-image: https://example.com/wholesale-banner.jpg
require-auth: true
```

### GraphQL Integration

The block uses the existing Adobe Commerce GraphQL configuration:
- **Endpoint**: Retrieved from `config.json` → `commerce-core-endpoint`
- **Authentication**: Uses customer token from cookie (`auth_dropin_user_token`)
- **Query**: Fetches customer group UID and segments via GraphQL

### Customer Data Sources

1. **Customer Group UID**: Always available for authenticated customers
   - Queried via: `customer { group { uid } }`
   
2. **Customer Segments**: Available via personalization API (if initialized)
   - Uses `@dropins/storefront-personalization/api.js`
   - Requires cart context for full segment data

### Local Storage / Session Storage

The block does not use localStorage or sessionStorage directly. It relies on:
- Cookie-based authentication tokens
- Personalization API cache (if available)

### Events

The block listens for:
- Authentication state changes (via existing commerce auth system)
- Personalization data updates (via personalization API events)

## Behavior Patterns

### Page Context Detection

- **Authenticated Users**: Block fetches customer data and displays segment-matched content
- **Unauthenticated Users**: 
  - If `require-auth=true`: Hides block or shows default content
  - If `require-auth=false`: Shows default content or hides based on `hide-if-no-match`

### User Interaction Flows

1. **Page Load**: Block initializes and checks authentication
2. **Data Fetch**: Queries GraphQL for customer group/segments
3. **Content Matching**: Matches segments/groups to configured content
4. **Content Update**: Dynamically updates banner, text, or HTML based on match
5. **Fallback**: Shows default content if no match or user not authenticated

### Error Handling

- **GraphQL Errors**: Logs warning and continues with default content
- **Missing Segments**: Falls back to customer group UID matching
- **Authentication Failures**: Shows default content or hides block
- **Personalization API Unavailable**: Continues without segment data, uses group UID only

## Usage Examples

### Basic Segment-Based Banner

1. Create block in content:
```html
<div class="customer-segment-content">
  <div class="default-content">
    <img src="/default-banner.jpg" alt="Default Banner">
    <p>Welcome to our store!</p>
  </div>
</div>
```

2. Add section metadata:
- `segment-VIP123-banner-image`: `/vip-banner.jpg`
- `segment-VIP123-text-content`: `Welcome, VIP Member!`

### Group-Based Content

1. Find customer group UID from Magento Admin
2. Configure:
- `group-MTIwMTYtMg-banner-image`: `/wholesale-banner.jpg`
- `group-MTIwMTYtMg-text-content`: `Wholesale Pricing Available`

### HTML Content Injection

```html
<div class="customer-segment-content">
  <div class="segment-content"></div>
</div>
```

Configure:
- `segment-premium-html-content`: `<div class="offer">Special Deal!</div>`

### Show/Hide Elements

```html
<div class="customer-segment-content">
  <div class="vip-offer" style="display: none;">VIP Exclusive</div>
  <div class="regular-offer">Regular Offer</div>
</div>
```

Configure:
- `segment-VIP-show-elements`: `.vip-offer`
- `segment-VIP-hide-elements`: `.regular-offer`

## Files

- `customer-segment-content.js` – Main block logic with GraphQL integration
- `customer-segment-content.css` – Styling for the block

## Notes

- Segment UIDs are created in Magento Admin (Customer Segments)
- The block automatically adapts when new segments are created
- For best results, ensure personalization API is initialized (happens automatically in commerce setup)
- GraphQL endpoint is configured in `config.json` (not hardcoded)
- Authentication uses existing commerce auth system (no separate login required)


