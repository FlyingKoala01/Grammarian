import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`${env.APP_NAME} listening on port ${env.PORT}`);
});

