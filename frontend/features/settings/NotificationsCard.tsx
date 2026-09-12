"use client";

import { useState } from "react";
import { ToggleRow } from "@/components/ui";

export function NotificationsCard() {
    const [allowEmail, setAllowEmail] = useState(true);
    const [commentsOnPosts, setCommentsOnPosts] = useState(true);
    const [mentions, setMentions] = useState(true);

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl text-gray-900">Notifications</h2>

            <div className="mt-6">
                <h3 className="text-xl text-gray-900">Email</h3>
                <p className="mt-1 text-sm text-gray-700">
                    These settings apply to the notifications you get by email.{" "}
                    <a href="#" className="text-[#1a73e8] underline hover:text-[#174ea6]">Learn more</a>
                </p>
                <ToggleRow label="Allow email notifications" enabled={allowEmail} onChange={setAllowEmail} />
            </div>

            <div className="mt-8">
                <h3 className="text-xl text-gray-900">Comments</h3>
                <ToggleRow label="Comments on your posts" enabled={commentsOnPosts} onChange={setCommentsOnPosts} />
                <ToggleRow label="Comments that mention you" enabled={mentions} onChange={setMentions} />
            </div>
        </section>
    );
}