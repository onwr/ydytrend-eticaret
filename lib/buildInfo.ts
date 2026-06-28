export const CRON_LAST_RUN_KEY = "CRON_LAST_RUN"
export const CRON_LAST_ERROR_KEY = "CRON_LAST_ERROR"
export const EMAIL_LAST_ERROR_KEY = "EMAIL_LAST_ERROR"

export const BUILD_TIME = process.env.BUILD_TIME ?? process.env.NEXT_BUILD_TIME ?? null
export const APP_VERSION = process.env.npm_package_version ?? "0.1.0"
