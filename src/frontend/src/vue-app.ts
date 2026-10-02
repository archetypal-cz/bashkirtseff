import type { App } from 'vue';
import { createPinia } from 'pinia';

// One Pinia shared by every island on the page, so stores (auth, filter, ...)
// are created and initialised once per page. SSR gets a fresh Pinia per render
// so state never leaks between requests.
const clientPinia = import.meta.env.SSR ? null : createPinia();

export default (app: App) => {
  app.use(clientPinia ?? createPinia());
};
