const requiredEnvVars = ["DATABASE_URL", "APP_URL"] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

export function getEnv(name: RequiredEnvVar): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function isAiEnabled() {
  return Boolean(getOptionalEnv("OPENAI_API_KEY"));
}
