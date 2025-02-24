import pino from "pino";
import { Environment } from "../environment";

export const logger = pino({
  level: Environment.LOG_LEVEL,
  timestamp: false,
  base: null,
});
