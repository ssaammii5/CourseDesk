"use client";

import { useState } from "react";
import { PasswordField } from "@/components/ui/FormFields";

export function SecurityCard() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [repeat, setRepeat] = useState("");
    const [flash, setFlash] = useState(false);

    const clear = () => {
        setCurrent("");
        setNext("");
        setRepeat("");
    };

    const save = () => {
        clear();
        setFlash(true);
        window.setTimeout(() => setFlash(false), 2000);
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
                <div>
                    <h2 className="text-2xl text-gray-900">Security</h2>
                    <p className="mt-3 text-sm font-semibold text-gray-900">Change password</p>
                    <p className="mt-1 text-sm text-gray-700">Update your password associated with your account.</p>
                </div>

                <div>
                    <div className="grid gap-5 lg:grid-cols-3">
                        <PasswordField label="Current Password" value={current} onChange={setCurrent} />
                        <PasswordField label="New password" value={next} onChange={setNext} />
                        <PasswordField label="Repeat new password" value={repeat} onChange={setRepeat} />
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        {flash && <span className="text-sm font-medium text-[#188038]">Password updated</span>}
                        <button type="button" onClick={clear} className="cursor-pointer rounded-full bg-[#cdd7ea] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#bcc9e2]">
                            Discard
                        </button>
                        <button type="button" onClick={save} className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}