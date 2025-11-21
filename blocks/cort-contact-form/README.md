# cort-contact-form Block

A contact form block with comprehensive validation and user feedback.

## Overview

The CORT Contact Form block displays a fully validated contact form with the following fields:
- First Name (required)
- Last Name (required)
- Email (required, validated format)
- Message/Content (required, textarea)

## Features

- **Field Validation**: All fields are required and validated
- **Email Validation**: Email field validates proper email format
- **Inline Error Messages**: Error messages appear below invalid fields
- **Real-time Validation**: Fields are validated on blur
- **Success Feedback**: Shows success message after valid submission
- **Auto-hide Success**: Success message automatically disappears after 5 seconds
- **Accessibility**: Proper ARIA labels and roles for screen readers
- **Form Reset**: Form clears after successful submission

## Usage

Add the block to your page:

```html
<div class="cort-contact-form"></div>
```

## Validation Rules

1. **First Name**: Required, cannot be empty
2. **Last Name**: Required, cannot be empty
3. **Email**: Required, must be valid email format (e.g., user@example.com)
4. **Message**: Required, cannot be empty

## User Experience

- Error messages appear below fields when validation fails
- First invalid field is focused when form submission fails
- Success message appears at the bottom of the form after successful submission
- Form automatically resets after successful submission
- Success message fades out after 5 seconds

## Files

- `cort-contact-form.js` – Form logic, validation, and submission handling
- `cort-contact-form.css` – Styling for the form and messages

