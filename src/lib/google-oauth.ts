export const GOOGLE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.analytics.readonly"
];

export const getAuthUrl = (clientId: string, redirectUri: string) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: redirectUri,
        client_id: clientId,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: GOOGLE_OAUTH_SCOPES.join(" ")
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
};

// Types for Token Response
export interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
    expiry_date?: number;
}
