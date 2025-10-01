import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  /* config options here */
  // experimental:{
  //   typedRoutes: true,
  // }
};

export default nextConfig;
