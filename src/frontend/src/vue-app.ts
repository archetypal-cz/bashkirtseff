import type { App } from 'vue';
import { createPinia } from 'pinia';

export default (app: App) => {
  // Install Pinia
  const pinia = createPinia();
  app.use(pinia);
};
