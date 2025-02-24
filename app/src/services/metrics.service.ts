import { NextFunction, Request, Response } from "express";
import { Registry } from "prom-client";
import * as promClient from "prom-client";

export const GlobalRegistry = new Registry();

const commonLabels = ["method", "route", "status", "status_code"];
interface ILabel {
  method: string;
  route: string;
  status: string;
  status_code: string;
}

// Collect default system metrics
promClient.collectDefaultMetrics({ register: GlobalRegistry });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: commonLabels,
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [GlobalRegistry],
});

const httpRequestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: commonLabels,
  registers: [GlobalRegistry],
});

const httpResponseSizes = new promClient.Histogram({
  name: "http_response_length_bytes",
  help: "Size of HTTP response in bytes",
  labelNames: commonLabels,
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [GlobalRegistry],
});

const httpRequestSizes = new promClient.Histogram({
  name: "http_request_length_bytes",
  help: "Size of HTTP request in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [GlobalRegistry],
});

const normalizePath = (req: Request): string => {
  let path = req.baseUrl + (req.route?.path || req.path);
  if (req.params) {
    // incase we don't get "req.route?.path" - we need to replace the path param names inplace of actual values
    Object.keys(req.params).forEach((paramKey) => {
      path = path.replace(`/${req.params[paramKey]}`, `/:${paramKey}`);
    });
  }

  return path;
};

// Middleware to track metrics
export const trackMetrics = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const duration = httpRequestDurationMicroseconds.startTimer();

  res.on("finish", () => {
    const durationInSeconds = duration();
    const path = normalizePath(req);
    const requestSize = req.body ? new Blob([req.body]).size : 0;
    httpRequestSizes.observe({ method: req.method, route: path }, requestSize);

    const normalizedStatusCode =
      ((res.statusCode || 200) / 100).toFixed() + "XX";
    const labels: ILabel = {
      method: req.method,
      route: path,
      status_code: String(res.statusCode || 200),
      status: normalizedStatusCode,
    };

    httpRequestCounter.inc(labels as {});
    httpRequestDurationMicroseconds.observe(labels as {}, durationInSeconds);

    const responseSize = Number(res.get("Content-Length")) || 0;
    httpResponseSizes.observe(labels as {}, responseSize);
  });

  next();
};
