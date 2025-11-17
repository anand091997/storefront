import { render as myRenderer } from '../../scripts/__dropins__/cus-dropin/render.js';
import { LoginContainer } from '../../scripts/__dropins__/cus-dropin/containers/LoginContainer.js';

export default async function decorate(block) {
  console.log('Rendering custom drop-in...');
  block.innerHTML = '';
  await myRenderer.render(LoginContainer, {})(block);
  console.log('Drop-in rendered ✅');
}
