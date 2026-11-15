/**
 * En-têtes de sécurité appliqués à toutes les pages.
 * CSP sans nonce (pages pré-rendues) : scripts limités au site lui-même.
 */
export function securityHeaders(isDev: boolean) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "*.supabase.co";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://i.ytimg.com https://${supabase}`,
    "font-src 'self'",
    `connect-src 'self' https://${supabase} wss://${supabase}${isDev ? " ws:" : ""}`,
    "frame-src https://www.youtube-nocookie.com https://clips.twitch.tv https://streamable.com https://js.stripe.com https://checkout.stripe.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\"), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  ];
}
