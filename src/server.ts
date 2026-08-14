import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
connectDatabase().then(() => app.listen(env.PORT, () => console.log(`Nexora API listening on :${env.PORT}`))).catch((error) => { console.error("Unable to connect to MongoDB", error); process.exit(1); });
