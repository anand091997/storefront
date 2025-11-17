import { render as myRenderer } from '../../scripts/__dropins__/cus-dropin/render.js';
import { LoginContainer } from '../../scripts/__dropins__/cus-dropin/containers/LoginContainer.js';

export default async function decorate(block) {
  block.innerHTML = '';
  await myRenderer.render(LoginContainer, {})(block);
}
