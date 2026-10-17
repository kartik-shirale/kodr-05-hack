import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://proctor.kodr.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register", "/forgot-password", "/reset-password"],
      disallow: ["/dashboard/", "/tests/", "/exam/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
