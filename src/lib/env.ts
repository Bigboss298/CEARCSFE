function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  signalRHubUrl: `${requireEnv('VITE_API_BASE_URL').replace(/\/$/, '')}/alertHub`,
} as const
