import process from "node:process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright starts a second Next process on :3001 while engineers may keep
  // :3000 running. A separate distDir avoids Next's single-dev-server lock.
  ...(process.env.AVEXA_PLAYWRIGHT === "1"
    ? { distDir: ".next-test" }
    : {}),
};

export default nextConfig;
