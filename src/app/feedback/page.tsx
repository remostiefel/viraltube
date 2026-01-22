"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Eye, MousePointerClick, TrendingUp, Sparkles, AlertCircle, RefreshCw, ArrowRight, Brain, Zap, Link as LinkIcon, Lock } from "lucide-react";
import { fetchAnalyticsAction, generatePrognosisAction, fetchChannelInsights } from "@/app/actions";
import { getAuthUrl } from "@/lib/google-oauth";
import { useEffect, useState } from "react";
import { ChannelData } from "@/lib/youtube";
import { AnalyticsData } from "@/lib/youtube-analytics";
import { StrategyProfile, PrognosisResult } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ReflectionRoom() {
  const router = useRouter();
  const [stats, setStats] = useState<ChannelData | null>(null); // Public stats
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null); // Private stats
  const [loadingStats, setLoadingStats] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Reflection State
  const [cortexProfile, setCortexProfile] = useState<StrategyProfile | null>(null);
  const [analysis, setAnalysis] = useState<PrognosisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    // 1. Load Profile
    const savedProfile = localStorage.getItem("nc_cortex_profile");
    if (savedProfile) {
      setCortexProfile(JSON.parse(savedProfile));
    }

    // 2. Check Connection
    const token = localStorage.getItem("nc_google_access_token");
    setIsConnected(!!token);

    // 3. Load Data
    const loadData = async () => {
      try {
        setLoadingStats(true);
        // Always try public stats first (doesn't need auth, just API Key)
        const publicData = await fetchChannelInsights();
        setStats(publicData);

        if (token) {
          const privateData = await fetchAnalyticsAction(token);
          if (privateData) {
            setAnalytics(privateData);
          } else {
            // Token might be expired or invalid scope
            // In a real app we'd refresh. Here we might just let it fail silently or show error.
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };
    loadData();
  }, []);

  const handleConnect = () => {
    const clientId = localStorage.getItem("nc_google_client_id");
    if (!clientId) {
      alert("Please configure Client ID in Settings first.");
      router.push("/settings");
      return;
    }
    // redirectUri must match what was set in console.
    const redirectUri = window.location.origin + "/settings/callback";
    const url = getAuthUrl(clientId, redirectUri);
    window.location.href = url;
  };

  const runAnalysis = async () => {
    if (!cortexProfile) return;
    setAnalyzing(true);
    setAnalysis(null);
    setApplied(false);

    try {
      // Use Real Metrics if available, else Mock
      const metrics = {
        avgViews: analytics ? (analytics.views / 30) : (stats ? parseInt(stats.statistics.viewCount) / parseInt(stats.statistics.videoCount) : 1000),
        retention: analytics ? (analytics.averageViewDuration / 60) * 100 : 35, // Rough approximation
        ctr: 5.5, // Analytics API doesn't give CTR easily in basics, assume static or mock for now unless we add it
        totalVideos: stats ? parseInt(stats.statistics.videoCount) : 10
      };

      const result = await generatePrognosisAction({
        currentProfile: cortexProfile,
        metrics
      });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyFix = () => {
    if (!analysis) return;
    localStorage.setItem("nc_cortex_profile", JSON.stringify(analysis.proposedProfile));
    setCortexProfile(analysis.proposedProfile);
    setApplied(true);
  };

  const subscriberCount = stats ? Number(stats.statistics.subscriberCount).toLocaleString() : "---";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Data Mirror
          </h2>
          <p className="text-muted-foreground mt-2">
            Metacognitive analysis of channel performance.
          </p>
        </div>

        {!isConnected && (
          <button
            onClick={handleConnect}
            className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            <LinkIcon className="w-4 h-4" /> Connect Channels
          </button>
        )}
        {isConnected && (
          <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Live Data Stream
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT: THE FACTS (Hard Data) */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground">Hard Data</h3>

          {!isConnected && (
            <div className="p-4 bg-muted/30 border border-border rounded-xl">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Data Restricted
              </p>
              <p className="text-sm font-bold">Connect Channel to see Real Retention & Audience Data.</p>
            </div>
          )}

          <StatCard
            title="Total Subscribers"
            value={subscriberCount}
            change={stats ? "+ LIVE" : "---"}
            trend="up"
            icon={Users}
            description="Network Scale"
          />

          {analytics ? (
            <>
              <StatCard
                title="Views (30d)"
                value={analytics.views.toLocaleString()}
                change="---"
                trend="up"
                icon={Eye}
                description="Real-Time Analytics"
                className="border-green-500/30 bg-green-500/5"
              />
              <StatCard
                title="Avg. Watch Time"
                value={`${(analytics.averageViewDuration / 60).toFixed(1)} min`}
                change={(analytics.averageViewDuration / 60) > 3 ? "Good" : "Low"}
                trend={(analytics.averageViewDuration / 60) > 3 ? "up" : "down"}
                icon={Eye}
                description="Retention Indicator"
                className={(analytics.averageViewDuration / 60) > 3 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}
              />
            </>
          ) : (
            <StatCard
              title="Avg. Retention"
              value="35%"
              change="-5%"
              trend="down"
              icon={Eye}
              description="Simulated Metric"
              className="border-red-500/30 bg-red-500/5 opacity-50"
            />
          )}
        </div>

        {/* RIGHT: THE MIRROR (AI Advisor) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground">The Mirror (AI Advisor)</h3>

          <div className="bg-card border border-border/40 rounded-2xl p-8 min-h-[400px] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {!analysis && !analyzing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-primary/10 p-6 rounded-full">
                  <Brain className="w-16 h-16 text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-bold">Ready to analyze performance?</h3>
                  <p className="text-muted-foreground">
                    I will compare your Strategy Profile ({cortexProfile?.tone || "Unknown"}) against your {isConnected ? "LIVE" : "Simulated"} Content Metrics to identify optimizations.
                  </p>
                </div>
                <button
                  onClick={runAnalysis}
                  disabled={!cortexProfile}
                  className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" /> Initiate Reflection
                </button>
                {!cortexProfile && <p className="text-xs text-red-400">Please calibrate Cortex first.</p>}
              </div>
            )}

            {analyzing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                <div className="bg-primary/10 p-6 rounded-full animate-spin">
                  <RefreshCw className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Analyzing Neural Patterns...</h3>
                <p className="text-muted-foreground">Correlating Retention vs. Hype Factor...</p>
              </div>
            )}

            {analysis && (
              <div className="flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {/* The Insight */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Diagnosis
                  </h4>
                  <p className="text-xl font-medium leading-relaxed">
                    "{analysis.analysis}"
                  </p>
                </div>

                {/* The Proposal */}
                <div className="bg-muted/30 border border-border/50 rounded-xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Recommendation
                  </h4>
                  <p className="text-lg text-muted-foreground italic">
                    "{analysis.suggestion}"
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg opacity-50">
                      <span className="block text-xs uppercase text-red-400 mb-1">Current Tone</span>
                      <span className="font-bold">{cortexProfile?.tone.toUpperCase()}</span>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="block text-xs uppercase text-green-400 mb-1">Proposed Tone</span>
                        <span className="font-bold">{analysis.proposedProfile.tone.toUpperCase()}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-auto">
                  <button
                    onClick={() => { setAnalysis(null); }}
                    className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={applyFix}
                    disabled={applied}
                    className={cn(
                      "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                      applied
                        ? "bg-green-600 text-white cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20"
                    )}
                  >
                    {applied ? "Optimized" : "Apply Strategy Update"}
                    {applied ? <CheckCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

import { CheckCircle } from "lucide-react";
