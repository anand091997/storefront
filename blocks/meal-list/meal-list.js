import { render as myRenderer } from '../../scripts/__dropins__/meal-dropin/render.js';
import { MealContainer } from '../../scripts/__dropins__/meal-dropin/containers/MealContainer.js';

export default async function decorate(block) {
  block.innerHTML = '';
  await myRenderer.render(MealContainer, {})(block);
}