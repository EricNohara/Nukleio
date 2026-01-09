"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

export default function PasswordResetPage() {
    const supabase = createClient();

    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN") {
                setReady(true);
            }
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!password.trim()) {
            setError("Password cannot be empty.");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password.trim(),
        });

        if (error) {
            setError("There was an error updating your password.");
            return;
        }

        setSuccess(true);
    };

    if (!ready) {
        return <p style={{ padding: 24 }}>Preparing password reset…</p>;
    }

    if (success) {
        return <p style={{ padding: 24 }}>Password updated successfully.</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ padding: 24, maxWidth: 360 }}>
            <label style={{ display: "block", marginBottom: 8 }}>
                New Password
            </label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", marginBottom: 12 }}
            />

            {error && (
                <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
            )}

            <button type="submit">Update Password</button>
        </form>
    );
}
