import express, { NextFunction, Request, Response } from "express";
import { Environment } from "./environment";
import { pinoHttp } from "pino-http";
import { logger } from "./services/logger.service";
import { TodoRouter } from "./controllers/todo";
import { GlobalRegistry, trackMetrics } from "./services/metrics.service";

const app = express();
const PORT = Environment.PORT ? Number(Environment.PORT) : 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger, autoLogging: false, base: null }));
app.use(trackMetrics);

// set default headers
app.use(function (_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Health Routes
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "ok!" });
});
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ message: "ok!" });
});

// TODO app Routes
app.use("/todo", TodoRouter);

// METRICS Route
app.get("/metrics", async (_req: Request, res: Response) => {
  const metricsData = await GlobalRegistry.metrics();
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(metricsData);
});

// error handling middleware - must be the last middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
