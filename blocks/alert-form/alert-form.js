/* eslint-disable import/no-cycle */
/**
 * Alert Form block
 * Renders a simple input + button that alerts the entered text on submit.
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'alert-form__form';

  const label = document.createElement('label');
  label.className = 'alert-form__label';
  label.setAttribute('for', 'alert-form-input');
  label.textContent = 'Enter Text text:';

  const input = document.createElement('input');
  input.className = 'alert-form__input';
  input.type = 'text';
  input.id = 'alert-form-input';
  input.name = 'message';
  input.placeholder = 'Type something for testing...';
  input.required = true;

  const button = document.createElement('button');
  button.className = 'alert-form__button';
  button.type = 'submit';
  button.textContent = 'Show Alert';

  form.append(label, input, button);
  block.textContent = '';
  block.append(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    // eslint-disable-next-line no-alert
    alert(value || 'No text entered');
  });
}
