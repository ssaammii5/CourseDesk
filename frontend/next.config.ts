import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/",
        permanent: false,
      },
      {
        source: "/teachers",
        destination: "/instructors",
        permanent: true,
      },
      {
        source: "/teachers/:path*",
        destination: "/instructors/:path*",
        permanent: true,
      },
      {
        source: "/students",
        destination: "/learners",
        permanent: true,
      },
      {
        source: "/students/:path*",
        destination: "/learners/:path*",
        permanent: true,
      },
      {
        source: "/class/:courseId/classwork",
        destination: "/course/:courseId?tab=coursework",
        permanent: true,
      },
      {
        source: "/class/:courseId/coursework",
        destination: "/course/:courseId?tab=coursework",
        permanent: true,
      },
      {
        source: "/class/:courseId/:path*",
        destination: "/course/:courseId/:path*",
        permanent: true,
      },
      {
        source: "/class/:courseId",
        destination: "/course/:courseId",
        permanent: true,
      },
      {
        source: "/course/:courseId/announcements",
        destination: "/course/:courseId",
        permanent: false,
      },
      {
        source: "/course/:courseId/classwork",
        destination: "/course/:courseId?tab=coursework",
        permanent: false,
      },
      {
        source: "/course/:courseId/coursework",
        destination: "/course/:courseId?tab=coursework",
        permanent: false,
      },
      {
        source: "/course/:courseId/curriculum",
        destination: "/course/:courseId?tab=curriculum",
        permanent: false,
      },
      {
        source: "/course/:courseId/submissions",
        destination: "/course/:courseId?tab=coursework",
        permanent: false,
      },
      {
        source: "/course/:courseId/people",
        destination: "/course/:courseId?tab=people",
        permanent: false,
      },
      {
        source: "/course/:courseId/grades",
        destination: "/course/:courseId?tab=grades",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
