export const localEnv: Record<string, string> = {
  LOG_LEVEL: "debug",
  PORT: "3000",
};

function getEnvVariable(key: string): string {
  if (process.env.DEPLOYMENT === "local") {
    return localEnv[key];
  }
  const value = process.env[key];
  return value || "";
}

export const Environment = {
  PORT: getEnvVariable("PORT") || 3000,
  LOG_LEVEL: getEnvVariable("LOG_LEVEL") || "info",
  DEPLOYMENT: getEnvVariable("DEPLOYMENT") || "dev",
};
