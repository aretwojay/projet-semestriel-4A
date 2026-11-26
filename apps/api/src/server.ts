import pino from "pino";
import { loadConfig } from "./config.js";
import { createPool } from "./db/pool.js";
import { buildApp } from "./http/app.js";

const config = loadConfig();
const logger = pino();
const pool = createPool(config.postgresUrl);

buildApp({ config, pool, logger }).listen(config.port, () => {
  logger.info({ port: config.port }, "Byte API listening");
});
