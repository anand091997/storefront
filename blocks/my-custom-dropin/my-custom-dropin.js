import { render as myRenderer } from '@dropins/cus-dropin/render.js';
import { LoginContainer } from '@dropins/cus-dropin/containers/LoginContainer.js';

export default async function decorate(block) {
  block.innerHTML = '';
  await myRenderer.render(LoginContainer, {})(block);
}
