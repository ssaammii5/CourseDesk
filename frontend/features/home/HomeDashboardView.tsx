"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks";
import { getMyCoursesRequest, type CourseDto } from "@/lib/api/courses";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { HomeHeroBanner } from "./HomeHeroBanner";
import { HomeStatsOverview } from "./HomeStatsOverview";
import { DueSoonCard } from "./DueSoonCard";
import { CoursesSection } from "./CoursesSection";

export function HomeDashboardView() {
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || user?.role === "Admin";

    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        let cancelled = false;
        Promise.all([
            getMyCoursesRequest().catch(() => [] as CourseDto[]),
            getAssignmentsRequest().catch(() => [] as AssignmentDto[]),
        ])
            .then(([coursesData, assignmentsData]) => {
                if (cancelled) return;
                setCourses(coursesData);
                setAssignments(assignmentsData);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    };

    useEffect(() => {
        const cleanup = loadData();
        const handleCourseUpdated = () => {
            loadData();
        };
        window.addEventListener("coursedesk:courses-updated", handleCourseUpdated);
        return () => {
            cleanup();
            window.removeEventListener("coursedesk:courses-updated", handleCourseUpdated);
        };
    }, []);

    // Compute metrics
    const metrics = useMemo(() => {
        const now = Date.now();
        const courseCount = courses.length;

        if (isInstructor) {
            // Instructor metrics
            const pendingReviews = assignments.reduce(
                (sum, a) => sum + (a.status !== "Draft" ? (a.turnedInCount ?? a.submissionCount ?? 0) : 0),
                0,
            );

            const gradedReviews = assignments.reduce(
                (sum, a) => sum + (a.gradedCount ?? 0),
                0,
            );

            const totalLearners = courses.reduce(
                (sum, c) => sum + (c.learnerCount ?? c.studentCount ?? 0),
                0,
            );

            return {
                courseCount,
                pendingCount: pendingReviews,
                completedCount: gradedReviews,
                totalLearnersCount: totalLearners,
                nextMilestoneText: "Review queue active",
            };
        }

        // Learner metrics
        const upcomingDue = assignments.filter(
            (a) =>
                a.mySubmissionStatus !== "Submitted" &&
                a.mySubmissionStatus !== "Graded" &&
                a.deadlineUtc &&
                new Date(a.deadlineUtc).getTime() > now,
        ).sort((a, b) => new Date(a.deadlineUtc!).getTime() - new Date(b.deadlineUtc!).getTime());

        const completedCount = assignments.filter(
            (a) => a.mySubmissionStatus === "Submitted" || a.mySubmissionStatus === "Graded",
        ).length;

        let nextMilestone = "All on track";
        if (upcomingDue.length > 0 && upcomingDue[0].deadlineUtc) {
            const nextDue = new Date(upcomingDue[0].deadlineUtc);
            const diffHours = (nextDue.getTime() - now) / (1000 * 60 * 60);
            if (diffHours < 24) {
                nextMilestone = diffHours < 1 ? "Due in < 1h" : `Due in ${Math.round(diffHours)}h`;
            } else if (diffHours < 48) {
                nextMilestone = "Due tomorrow";
            } else {
                nextMilestone = nextDue.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            }
        }

        return {
            courseCount,
            pendingCount: upcomingDue.length,
            completedCount,
            totalLearnersCount: 0,
            nextMilestoneText: nextMilestone,
        };
    }, [courses, assignments, isInstructor]);

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:gap-7">
                {/* Modern Hero Greeting Banner */}
                <HomeHeroBanner
                    user={user}
                    isInstructor={isInstructor}
                    courseCount={metrics.courseCount}
                    pendingCount={metrics.pendingCount}
                    completedCount={metrics.completedCount}
                />

                {/* 4-Card Metrics Grid */}
                <HomeStatsOverview
                    isInstructor={isInstructor}
                    courseCount={metrics.courseCount}
                    pendingCount={metrics.pendingCount}
                    completedCount={metrics.completedCount}
                    totalLearnersCount={metrics.totalLearnersCount}
                    nextMilestoneText={metrics.nextMilestoneText}
                />

                {/* Priority Action Center / Due Soon */}
                <DueSoonCard />

                {/* Enrolled Courses / Courses Instructed Catalog */}
                <CoursesSection />
            </div>
        </div>
    );
}
