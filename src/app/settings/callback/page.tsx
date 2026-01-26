"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeGoogleTokenAction } from "@/app/actions";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const processed = useRef(false);

    useEffect(() => {
        if (!code) {
            return;
        }
        if (processed.current) return;
        processed.current = true;

        const exchange = async () => {
            const clientId = localStorage.getItem("nc_google_client_id");
            const clientSecret = localStorage.getItem("nc_google_client_secret");

            // Assuming we are running on localhost:3000 for development mainly
            const redirectUri = window.location.origin + "/settings/callback";

            if (!clientId || !clientSecret) {
                setStatus("error");
                alert("Missing Client ID/Secret in Settings!");
                return;
            }

            try {
                const tokens = await exchangeGoogleTokenAction(code, clientId, clientSecret, redirectUri);
                if (tokens && tokens.access_token) {
                    localStorage.setItem("nc_google_access_token", tokens.access_token);
                    if (tokens.refresh_token) {
                        localStorage.setItem("nc_google_refresh_token", tokens.refresh_token);
                    }
                    setStatus("success");
                    // Wait a moment then redirect to Feedback
                    setTimeout(() => router.push("/feedback"), 1500);
                } else {
                    setStatus("error");
                }
            } catch (e) {
                console.error(e);
                setStatus("error");
            }
        };

        exchange();
    }, [code, router]);

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4 text-red-500">
                <XCircle className="w-12 h-12" />
                <h2 className="text-xl font-bold">Connection Failed</h2>
                <div className="bg-red-50 text-red-700 p-4 rounded-lg font-mono text-sm max-w-md text-center">
                    <p className="font-bold">{error}</p>
                    <p>{errorDescription}</p>
                </div>
                <p className="text-muted-foreground text-sm">Usually this means the user declined access or needs to be added to Test Users in Google Cloud.</p>
                <button onClick={() => router.push("/settings")} className="text-primary hover:underline">
                    Back to Settings
                </button>
            </div>
        );
    }

    if (!code) return <div className="h-screen flex items-center justify-center text-red-500">Missing Auth Code</div>;

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-background space-y-4">
            {status === "processing" && (
                <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <h2 className="text-xl font-bold">Establishing Neural Link...</h2>
                </>
            )}
            {status === "success" && (
                <>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <h2 className="text-xl font-bold">Link Established</h2>
                    <p className="text-muted-foreground">Redirecting to Data Mirror...</p>
                </>
            )}
            {status === "error" && (
                <>
                    <XCircle className="w-12 h-12 text-red-500" />
                    <h2 className="text-xl font-bold">Link Failed</h2>
                    <p className="text-muted-foreground">Check Console logs or Settings.</p>
                    <button onClick={() => router.push("/settings")} className="text-primary hover:underline">
                        Back to Settings
                    </button>
                </>
            )}
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <CallbackContent />
        </Suspense>
    );
}
