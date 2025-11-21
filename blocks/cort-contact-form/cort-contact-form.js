/**
 * CORT Contact Form block
 * Displays a contact form with validation and success messaging.
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // Create form container
  const form = document.createElement('form');
  form.className = 'cort-contact-form__form';
  form.noValidate = true; // Use custom validation

  // Helper function to create form field
  const createField = (id, name, label, type = 'text', required = true) => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'cort-contact-form__field';

    const labelEl = document.createElement('label');
    labelEl.className = 'cort-contact-form__label';
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    if (required) {
      labelEl.innerHTML += '<span class="cort-contact-form__required">*</span>';
    }

    let inputEl;
    if (type === 'textarea') {
      inputEl = document.createElement('textarea');
      inputEl.rows = 5;
    } else {
      inputEl = document.createElement('input');
      inputEl.type = type;
    }

    inputEl.className = 'cort-contact-form__input';
    inputEl.id = id;
    inputEl.name = name;
    inputEl.required = required;
    if (type === 'email') {
      inputEl.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
    }

    const errorEl = document.createElement('div');
    errorEl.className = 'cort-contact-form__error';
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');

    fieldWrapper.append(labelEl, inputEl, errorEl);
    return { fieldWrapper, inputEl, errorEl };
  };

  // Create form fields
  const firstNameField = createField('cort-contact-first-name', 'first-name', 'First Name');
  const lastNameField = createField('cort-contact-last-name', 'last-name', 'Last Name');
  const emailField = createField('cort-contact-email', 'email', 'Email', 'email');
  const contentField = createField('cort-contact-content', 'content', 'Message', 'textarea');

  // Add all fields to form
  form.append(
    firstNameField.fieldWrapper,
    lastNameField.fieldWrapper,
    emailField.fieldWrapper,
    contentField.fieldWrapper,
  );

  // Create submit button
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'cort-contact-form__button-wrapper';

  const button = document.createElement('button');
  button.className = 'cort-contact-form__button';
  button.type = 'submit';
  button.textContent = 'Submit';

  buttonWrapper.append(button);
  form.append(buttonWrapper);

  // Success message container
  const successMessage = document.createElement('div');
  successMessage.className = 'cort-contact-form__success';
  successMessage.setAttribute('role', 'alert');
  successMessage.setAttribute('aria-live', 'polite');
  successMessage.hidden = true;

  // Validation functions
  const validateField = (input, errorEl) => {
    const value = input.value.trim();
    let error = '';

    if (input.required && !value) {
      error = `${input.closest('.cort-contact-form__field').querySelector('label').textContent.replace('*', '').trim()} is required`;
    } else if (input.type === 'email' && value) {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
        error = 'Please enter a valid email address';
      }
    }

    if (error) {
      errorEl.textContent = error;
      errorEl.classList.add('cort-contact-form__error--visible');
      input.classList.add('cort-contact-form__input--error');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.textContent = '';
      errorEl.classList.remove('cort-contact-form__error--visible');
      input.classList.remove('cort-contact-form__input--error');
      input.setAttribute('aria-invalid', 'false');
    }

    return !error;
  };

  // Real-time validation on blur
  const allInputs = [
    firstNameField.inputEl,
    lastNameField.inputEl,
    emailField.inputEl,
    contentField.inputEl,
  ];
  allInputs.forEach((input) => {
    input.addEventListener('blur', () => {
      const errorEl = input.closest('.cort-contact-form__field').querySelector('.cort-contact-form__error');
      validateField(input, errorEl);
    });

    input.addEventListener('input', () => {
      // Clear error when user starts typing
      if (input.classList.contains('cort-contact-form__input--error')) {
        const errorEl = input.closest('.cort-contact-form__field').querySelector('.cort-contact-form__error');
        if (errorEl.textContent) {
          errorEl.textContent = '';
          errorEl.classList.remove('cort-contact-form__error--visible');
          input.classList.remove('cort-contact-form__input--error');
          input.setAttribute('aria-invalid', 'false');
        }
      }
    });
  });

  // Form submission handler
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Hide previous success message
    successMessage.hidden = true;

    // Validate all fields
    let isValid = true;
    isValid = validateField(firstNameField.inputEl, firstNameField.errorEl) && isValid;
    isValid = validateField(lastNameField.inputEl, lastNameField.errorEl) && isValid;
    isValid = validateField(emailField.inputEl, emailField.errorEl) && isValid;
    isValid = validateField(contentField.inputEl, contentField.errorEl) && isValid;

    if (!isValid) {
      // Focus on first invalid field
      const firstInvalid = form.querySelector('.cort-contact-form__input--error');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // Form is valid - show success message
    successMessage.textContent = 'Form submitted successfully!';
    successMessage.hidden = false;
    successMessage.classList.add('cort-contact-form__success--visible');

    // Reset form
    form.reset();

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.remove('cort-contact-form__success--visible');
      setTimeout(() => {
        successMessage.hidden = true;
      }, 300); // Wait for fade-out animation
    }, 5000);
  });

  // Clear block and add form
  block.textContent = '';
  block.append(form, successMessage);
}
