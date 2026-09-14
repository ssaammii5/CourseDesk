import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/class/:courseId/announcements",
        destination: "/class/:courseId",
        permanent: false,
      },
      {
        source: "/class/:courseId/classwork",
        destination: "/class/:courseId?tab=classwork",
        permanent: false,
      },
      {
        source: "/class/:courseId/curriculum",
        destination: "/class/:courseId?tab=curriculum",
        permanent: false,
      },
      {
        source: "/class/:courseId/submissions",
        destination: "/class/:courseId?tab=classwork",
        permanent: false,
      },
      {
        source: "/class/:courseId/people",
        destination: "/class/:courseId?tab=people",
        permanent: false,
      },
      {
        source: "/class/:courseId/grades",
        destination: "/class/:courseId?tab=grades",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
