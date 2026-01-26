"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { HealthDashboard } from "@/components/dashboard/HealthDashboard";
import { Users, Eye, Sparkles, AlertCircle, RefreshCw, ArrowRight, Brain, Zap, Link as LinkIcon, Lock, Film, CheckCircle, Save, X, Activity, Stethoscope } from "lucide-react";
import { fetchAnalyticsAction, fetchChannelInsights, fetchChannelVideosAction, analyzeViralVideoAction, generateChannelAuditAction, saveTemplateAction, analyzeHookRetentionAction } from "@/app/actions";
import { getAuthUrl } from "@/lib/google-oauth";
import { useEffect, useState, useMemo } from "react";
import { ChannelData, OutlierVideo } from "@/lib/youtube";
import { ViralAnalysisResult } from "@/lib/openai";
import { AnalyticsData, calculateSatisfactionScore, calculateQCR, calculateZombieScore } from "@/lib/youtube-analytics";
import { ChannelAuditResult, InsightItem, RetentionAnalysis } from "@/lib/gemini";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { saveReport, getReports, deleteReport, SavedReport, exportReport } from "@/lib/reports";
import { FileText, Download, Trash2, CheckSquare, Square } from "lucide-react";

export default function ReflectionRoom() {
  const router = useRouter();

  // STATE PERSISTENCE KEYS
  const STORAGE_KEY_STATS = "nc_cache_stats";
  const STORAGE_KEY_ANALYTICS = "nc_cache_analytics";
  const STORAGE_KEY_VIDEOS = "nc_cache_videos";

  const [stats, setStats] = useState<ChannelData | null>(null); // Public stats
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null); // Private stats
  const [loadingStats, setLoadingStats] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // audit State
  const [audit, setAudit] = useState<ChannelAuditResult | null>(null);
  const [auditing, setAuditing] = useState(false);

  // Wisdom Loopback State
  const [savingInsight, setSavingInsight] = useState<InsightItem | null>(null);
  const [customWisdomTitle, setCustomWisdomTitle] = useState("");

  // Video Intelligence State
  const [recentVideos, setRecentVideos] = useState<OutlierVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<OutlierVideo | null>(null);

  // Analyses
  const [videoAnalysis, setVideoAnalysis] = useState<ViralAnalysisResult | null>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);

  const [retentionAnalysis, setRetentionAnalysis] = useState<RetentionAnalysis | null>(null);
  const [analyzingRetention, setAnalyzingRetention] = useState(false);

  // REPORTS SYSTEM
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const [reports, setReports] = useState<SavedReport[]>([]);

  // MULTI-SELECT SYSTEM
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    // Load reports on mount
    setReports(getReports());

    // LOAD CACHED METRICS
    const cachedStats = localStorage.getItem(STORAGE_KEY_STATS);
    const cachedAnalytics = localStorage.getItem(STORAGE_KEY_ANALYTICS);
    const cachedVideos = localStorage.getItem(STORAGE_KEY_VIDEOS);

    if (cachedStats) setStats(JSON.parse(cachedStats));
    if (cachedAnalytics) setAnalytics(JSON.parse(cachedAnalytics));
    if (cachedVideos) {
      setRecentVideos(JSON.parse(cachedVideos));
      setLoadingVideos(false);
    }

    const token = localStorage.getItem("nc_google_access_token");
    setIsConnected(!!token);

    // Always refresh data in background
    loadData(token);
  }, []);

  const loadData = async (token: string | null) => {
    try {
      if (!stats) setLoadingStats(true); // Only show spinner if no cache

      const publicData = await fetchChannelInsights();
      setStats(publicData);
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(publicData));

      if (token) {
        const privateData = await fetchAnalyticsAction(token);
        if (privateData) {
          setAnalytics(privateData);
          localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(privateData));
        }
      }
    } catch (e) { console.error(e); } finally { setLoadingStats(false); }
  };

  const refreshReports = () => {
    setReports(getReports());
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this report?")) {
      deleteReport(id);
      refreshReports();
    }
  };

  const handleExportReport = (report: SavedReport, e: React.MouseEvent) => {
    e.stopPropagation();
    exportReport(report);
  };


  // CORTEX Metrics Calculation
  const cortexMetrics = useMemo(() => {
    // FALLBACK: If private analytics missing, use public stats + recent videos to simulate
    if (!stats) return null;

    let views = 0;
    let avgViewDuration = 60; // Default estimate

    if (analytics) {
      views = analytics.views;
      avgViewDuration = analytics.averageViewDuration;
    } else if (recentVideos.length > 0) {
      // SIMULATE using stats derived from Recent Videos (Public Data)
      views = recentVideos.reduce((acc, v) => acc + v.viewCount, 0);
      // Heuristic: If views > 10k per video avg (approx), assume better engagement or higher retention
      const avgViews = views / recentVideos.length;
      avgViewDuration = avgViews > 5000 ? 120 : 45;
    } else {
      // Worst case: no analytics and no recent videos loaded yet
      return null;
    }

    const totalSubs = parseInt(stats.statistics.subscriberCount);
    const { activeRatio } = calculateZombieScore(views, totalSubs);

    // Simulations for metrics that require private data
    const mockLikes = views * 0.04;
    const mockComments = views * 0.005;
    const estLength = 600;

    const satisfaction = calculateSatisfactionScore(
      views,
      mockLikes,
      mockComments,
      avgViewDuration,
      estLength,
      5.5
    );
    const qcr = calculateQCR(5.5, avgViewDuration);

    return { satisfaction, qcr, activeRatio };
  }, [analytics, stats, recentVideos]);


  useEffect(() => {
    if (stats?.id) loadVideos(stats.id);
  }, [stats]);

  const loadVideos = async (channelId: string) => {
    // If we have cached videos, don't show full loading spinner, just background refresh
    if (recentVideos.length === 0) setLoadingVideos(true);
    try {
      const videos = await fetchChannelVideosAction(channelId);
      setRecentVideos(videos);
      localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
    } catch (e) { console.error(e); } finally { setLoadingVideos(false); }
  };

  const handleConnect = () => {
    const clientId = localStorage.getItem("nc_google_client_id");
    if (!clientId) { router.push("/settings"); return; }
    const redirectUri = window.location.origin + "/settings/callback";
    window.location.href = getAuthUrl(clientId, redirectUri);
  };

  const handleRunAudit = async () => {
    // ROBUSTNESS FIX: Allow audit even if some data missing, but warn
    if (!analytics && recentVideos.length === 0) {
      alert("Cannot Audit: No Analytics AND No Video Data available. Connect channel first.");
      return;
    }

    setAuditing(true);
    setAudit(null);

    try {
      // Create mock objects if data is missing to prevent crash
      let safeAnalytics = analytics;

      if (!safeAnalytics) {
        // SIMULATE ANALYTICS from Recent Videos (Public Data) to avoid "Dormant" hallucinations
        const totalViews = recentVideos.reduce((acc, v) => acc + v.viewCount, 0);
        // Estimate watch time (approx 45s for shorts, 3m for longform) - simplistic heuristic
        const estMinutes = Math.floor(totalViews * 0.8);

        safeAnalytics = {
          views: totalViews,
          subscribersGained: 0, // Unknown
          averageViewDuration: 45, // Assume Short avg
          estimatedMinutesWatched: estMinutes
        } as AnalyticsData;
      }

      const result = await generateChannelAuditAction(safeAnalytics!, recentVideos);

      if (result) {
        setAudit(result);
        // SAVE REPORT AUTOMATICALLY
        saveReport({
          type: "CHANNEL_AUDIT",
          title: `Channel Audit - ${new Date().toLocaleDateString()}`,
          summary: result.executiveSummary,
          data: result,
          sentiment: result.overallSentiment === "Bullish" ? "positive" : result.overallSentiment === "Bearish" ? "negative" : "neutral"
        });
        refreshReports();
      } else {
        alert("Audit returned no results. AI service might be busy.");
      }

    } catch (e) {
      console.error(e);
      alert("Audit Failed. See console.");
    } finally {
      setAuditing(false);
    }
  };

  const handleAnalyzeVideo = async (video: OutlierVideo) => {
    if (multiSelectMode) {
      // Toggle Selection
      setSelectedVideoIds(prev =>
        prev.includes(video.id)
          ? prev.filter(id => id !== video.id)
          : [...prev, video.id]
      );
      return;
    }

    setSelectedVideo(video);
    setVideoAnalysis(null);
    setRetentionAnalysis(null); // Reset
  };

  const handleRunBatchAnalysis = async () => {
    if (selectedVideoIds.length === 0) return;
    setBatchAnalyzing(true);

    let completed = 0;

    // Process sequentially to be nice to API
    for (const videoId of selectedVideoIds) {
      const video = recentVideos.find(v => v.id === videoId);
      if (!video) continue;

      try {
        // Run Retention Analysis for each
        const result = await analyzeHookRetentionAction(videoId);
        if (result) {
          saveReport({
            type: "RETENTION_SURGEON",
            title: `Surgeon: ${video.title.slice(0, 30)}...`,
            summary: `Risk: ${result.dropOffRisk} | Hook Score: ${result.hookScore}`,
            data: result,
            sentiment: result.dropOffRisk === "Low" ? "positive" : result.dropOffRisk === "High" ? "negative" : "neutral",
            sourceId: videoId
          });
        }
        completed++;
      } catch (e) {
        console.error(`Failed to analyze ${videoId}`, e);
      }
    }

    refreshReports();
    setBatchAnalyzing(false);
    setMultiSelectMode(false);
    setSelectedVideoIds([]);
    setActiveTab("reports"); // Switch to view results

    // NOTIFICATION UPDATE
    setNotification({ message: `Batch Analysis Complete! ${completed} reports generated.`, type: 'success' });
  };

  const runFullAnalysis = async () => {
    if (!selectedVideo) return;
    setAnalyzingVideo(true);
    try {
      const url = `https://www.youtube.com/watch?v=${selectedVideo.id}`;
      const result = await analyzeViralVideoAction(url);
      if (result && 'headlines' in result) setVideoAnalysis(result as ViralAnalysisResult);
    } catch (e) { console.error(e); } finally { setAnalyzingVideo(false); }
  };

  const runRetentionAnalysis = async () => {
    if (!selectedVideo) return;
    setAnalyzingRetention(true);
    try {
      const result = await analyzeHookRetentionAction(selectedVideo.id);
      setRetentionAnalysis(result);
      if (result) {
        // Save Report
        saveReport({
          type: "RETENTION_SURGEON",
          title: `Surgeon: ${selectedVideo.title.slice(0, 30)}...`,
          summary: `Risk: ${result.dropOffRisk} | Hook Score: ${result.hookScore}`,
          data: result,
          sentiment: result.dropOffRisk === "Low" ? "positive" : result.dropOffRisk === "High" ? "negative" : "neutral",
          sourceId: selectedVideo.id
        });
        refreshReports();
      }
    } catch (e) { console.error(e); } finally { setAnalyzingRetention(false); }
  };

  const openSaveDialog = (item: InsightItem) => {
    setSavingInsight(item);
    setCustomWisdomTitle(item.title);
  };

  const saveToWisdom = async () => {
    if (!savingInsight) return;
    try {
      await saveTemplateAction(
        "viral-wisdom",
        customWisdomTitle,
        { description: savingInsight.description, optimizationPrompt: `Law: ${savingInsight.description}` },
        undefined, ["CORTEX Insight"], 5, "GROWTH"
      );
      setNotification({ message: "Insight Saved to Wisdom!", type: 'success' });
      setSavingInsight(null);
    } catch (e) {
      setNotification({ message: "Failed to Save.", type: 'error' });
    }
  };

  const subscriberCount = stats ? Number(stats.statistics.subscriberCount).toLocaleString() : "---";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 relative">

      {/* Toast Notification */}
      {notification && (
        <div className={cn("fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-2 border",
          notification.type === 'success' ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600"
        )}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Analytics
          </h2>
          <p className="text-muted-foreground mt-2">Satisfaction Engine & Surgeon.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-black/20 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5")}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === "reports" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5")}
            >
              Reports History
            </button>
          </div>
          {!isConnected ? (
            <button onClick={handleConnect} className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold text-sm">Connect</button>
          ) : <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg font-bold text-sm">Active</div>}
        </div>
      </div>

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Analysis Archive
          </h3>

          {reports.length === 0 ? (
            <div className="text-center py-20 opacity-50 border-2 border-dashed rounded-xl">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>No reports generated yet.</p>
              <p className="text-sm">Run a Surgeon Analysis or Audit to save results here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => (
                <div key={report.id} className="bg-card border border-border/50 p-6 rounded-xl hover:shadow-lg transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("px-2 py-1 rounded text-xs font-bold uppercase",
                      report.type === "CHANNEL_AUDIT" ? "bg-purple-500/10 text-purple-400" :
                        report.type === "RETENTION_SURGEON" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      {report.type.replace("_", " ")}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => handleExportReport(report, e)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDeleteReport(report.id, e)} className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-2 line-clamp-1">{report.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 h-16">{report.summary}</p>

                  <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    <span className={cn("font-bold",
                      report.sentiment === "positive" ? "text-green-500" :
                        report.sentiment === "negative" ? "text-red-500" : "text-yellow-500"
                    )}>
                      {report.sentiment.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB (Show only if active) */}
      <div className={cn("space-y-8", activeTab === "reports" && "hidden")}>

        {/* DASHBOARD GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {!isConnected && <div className="md:col-span-3 p-4 bg-muted/30 border rounded-xl font-bold text-sm">Connect for Real CORTEX Metrics. (Currently Simulated)</div>}

          {/* Main Health Dashboard (2/3 width) */}
          <div className="md:col-span-2 bg-card border border-border/50 shadow-xl rounded-2xl p-6">
            {cortexMetrics ? (
              <HealthDashboard
                satisfactionScore={cortexMetrics.satisfaction.score}
                grade={cortexMetrics.satisfaction.grade}
                qcrStatus={cortexMetrics.qcr.qcr}
                zombieRatio={cortexMetrics.activeRatio}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] opacity-50">
                <Activity className="w-12 h-12 mb-4" />
                <p>Waiting for Channel Data...</p>
              </div>
            )}
          </div>

          {/* Subscriber Card (1/3 width) */}
          <div className="h-full">
            <StatCard
              title="Subscribers"
              value={subscriberCount}
              change=""
              icon={Users}
              description="Total Audience"
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* NEW COMPACT HEADER */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Brain className="w-5 h-5" /> THE GENERAL
            </h3>
            {!audit && !auditing && (
              <button
                onClick={handleRunAudit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg flex gap-2 items-center text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                <Sparkles className="w-4 h-4" /> INSPECTION
              </button>
            )}
          </div>

          <div className="bg-card border border-border/40 rounded-2xl p-6 min-h-[150px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {!audit && !auditing && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-100 z-10 relative">

                {/* 1. TOTAL VIEWS */}
                <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-background/80 transition-colors group">
                  <div className="text-xs font-bold text-cyan-200/70 uppercase mb-1 tracking-wider group-hover:text-cyan-200">Total Views</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                      {analytics ? analytics.views.toLocaleString() : (recentVideos.length > 0) ? recentVideos.reduce((acc, v) => acc + v.viewCount, 0).toLocaleString() : "---"}
                    </div>
                    {(analytics || recentVideos.length > 0) && (
                      <div className="text-xs font-bold text-emerald-400 animate-in slide-in-from-left-1 mt-1">
                        {analytics
                          ? `+${Math.round(analytics.views / 4.3).toLocaleString()}/wk`
                          : `+${recentVideos.filter(v => new Date(v.publishedAt) > new Date(Date.now() - 7 * 86400000)).reduce((acc, v) => acc + v.viewCount, 0).toLocaleString()}/wk`
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. LIBRARY SIZE */}
                <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-background/80 transition-colors group">
                  <div className="text-xs font-bold text-purple-200/70 uppercase mb-1 tracking-wider group-hover:text-purple-200">Library Size</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-mono font-black text-white drop-shadow-sm">{stats?.statistics?.videoCount || recentVideos.length || "---"}</div>
                    <div className="text-xs font-bold text-purple-400 mt-1">
                      {/* Count videos published in last 7 days */}
                      +{recentVideos.filter(v => new Date(v.publishedAt) > new Date(Date.now() - 7 * 86400000)).length} new / wk
                    </div>
                  </div>
                </div>

                {/* 3. AVG DURATION */}
                <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-background/80 transition-colors group">
                  <div className="text-xs font-bold text-green-200/70 uppercase mb-1 tracking-wider group-hover:text-green-200">Avg Duration</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                      {analytics ? Math.round(analytics.averageViewDuration) + "s" :
                        (recentVideos.length > 0) ? (recentVideos.reduce((acc, v) => acc + v.viewCount, 0) / recentVideos.length > 10000 ? "120s" : "45s") : "---"}
                    </div>
                    {(analytics || recentVideos.length > 0) && (
                      <div className="text-xs font-bold text-green-400 mt-1">
                        ({analytics
                          ? Math.round((analytics.averageViewDuration / (analytics.estimatedMinutesWatched * 60 / analytics.views)) * 100) || 40
                          : "42"}%) Retention
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. WATCH TIME */}
                <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-background/80 transition-colors group">
                  <div className="text-xs font-bold text-amber-200/70 uppercase mb-1 tracking-wider group-hover:text-amber-200">Est. Watch Time</div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                      {analytics ? Math.round(analytics.estimatedMinutesWatched / 60) + "h" :
                        (recentVideos.length > 0) ? Math.round((recentVideos.reduce((acc, v) => acc + v.viewCount, 0) * 0.8) / 60) + "h" : "---"}
                    </div>
                    <div className="text-xs font-bold text-amber-400 mt-1">
                      {analytics
                        ? `+${Math.round((analytics.estimatedMinutesWatched / 60) / 4.3)}h/wk`
                        : "---"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {auditing && <div className="flex-1 flex items-center justify-center animate-pulse font-bold py-12">Auditing Channel Data...</div>}

            {audit && (
              <div className="space-y-6 animate-in fade-in pt-4">
                <div className="flex justify-between items-start">
                  <div><h4 className="font-bold uppercase text-primary">Summary</h4><p className="text-lg font-medium">{audit.executiveSummary}</p></div>
                  <div className="px-3 py-1 bg-primary/10 rounded-lg">{audit.overallSentiment}</div>
                </div>
                <div className="space-y-3">
                  {audit.wins.map((item, i) => <InsightCard key={i} type="win" item={item} onSave={() => openSaveDialog(item)} />)}
                  {audit.opportunities.map((item, i) => <InsightCard key={i} type="opportunity" item={item} onSave={() => openSaveDialog(item)} />)}
                  {audit.losses.map((item, i) => <InsightCard key={i} type="loss" item={item} onSave={() => openSaveDialog(item)} />)}
                </div>
                <button onClick={() => setAudit(null)} className="text-sm underline opacity-50">Reset</button>
              </div>
            )}
          </div>
        </div>
      </div>



      <div className="space-y-6 pt-8 border-t border-border/40">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Film className="w-5 h-5" /> THE SURGEON
          </h3>
          <div className="flex gap-4">
            {multiSelectMode && (
              <button
                onClick={handleRunBatchAnalysis}
                disabled={selectedVideoIds.length === 0 || batchAnalyzing}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-bold animate-pulse"
              >
                {batchAnalyzing ? "Processing..." : `Analyze ${selectedVideoIds.length} Videos`}
              </button>
            )}
            <button
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                setSelectedVideoIds([]); // Reset selection on toggle
              }}
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded border transition-colors flex items-center gap-2",
                multiSelectMode ? "bg-white text-black border-white" : "bg-transparent text-muted-foreground border-border hover:border-white hover:text-white"
              )}
            >
              {multiSelectMode ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              {multiSelectMode ? "Cancel Select" : "Multi-Select"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {recentVideos.map(video => (
              <div
                key={video.id}
                onClick={() => handleAnalyzeVideo(video)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer flex gap-3 hover:bg-card/80 transition-all relative overflow-hidden",
                  selectedVideo?.id === video.id && !multiSelectMode ? "bg-primary/10 border-primary" : "bg-card/50",
                  multiSelectMode && selectedVideoIds.includes(video.id) && "bg-blue-500/20 border-blue-500"
                )}
              >
                {/* Multi-Select Indicator */}
                {multiSelectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    {selectedVideoIds.includes(video.id)
                      ? <CheckSquare className="w-5 h-5 text-blue-400 bg-black/50 rounded" />
                      : <Square className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>
                )}

                <img src={video.thumbnailUrl} className="w-24 h-16 object-cover rounded-md bg-black" />
                <div><h4 className="text-xs font-bold line-clamp-2">{video.title}</h4></div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedVideo ? (
              <div className="bg-card border border-border/40 rounded-2xl p-6 min-h-[400px]">
                <div className="flex gap-6 mb-6 pb-6 border-b">
                  <div className="space-y-2">
                    <img src={selectedVideo.thumbnailUrl} className="w-48 rounded-xl shadow-lg" />
                    {/* MINI STATS */}
                    <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                      <div className="bg-white/5 p-2 rounded">
                        <div className="uppercase text-[10px]">Views</div>
                        <div className="font-mono font-bold">{selectedVideo.viewCount.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded">
                        <div className="uppercase text-[10px]">Score</div>
                        <div className={cn("font-mono font-bold", selectedVideo.outlierScore > 1 ? "text-green-400" : "text-yellow-400")}>{selectedVideo.outlierScore}x</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                    <p className="text-xs text-muted-foreground mb-4">Published: {new Date(selectedVideo.publishedAt).toLocaleDateString()}</p>

                    <div className="flex gap-2">
                      <button onClick={runFullAnalysis} disabled={analyzingVideo} className="bg-secondary px-4 py-2 rounded-lg text-xs font-bold flex gap-2 items-center">
                        {analyzingVideo ? "Scanning..." : <><Brain className="w-3 h-3" /> Full Scan</>}
                      </button>
                      <button onClick={runRetentionAnalysis} disabled={analyzingRetention} className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold flex gap-2 items-center">
                        {analyzingRetention ? "Operating..." : <><Stethoscope className="w-3 h-3" /> Check Vital Signs</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RETENTION ANALYSIS RESULT */}
                {retentionAnalysis && (
                  <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-red-500 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> SURGEON REPORT</h4>
                      <div className="text-xs font-bold uppercase bg-red-500/10 px-2 py-1 rounded">Risk: {retentionAnalysis.dropOffRisk}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Hook Score</div>
                        <div className="text-2xl font-mono font-bold">{retentionAnalysis.hookScore}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Primary Trigger</div>
                        <div className="font-bold">{retentionAnalysis.triggerUsed}</div>
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-red-500/10">
                      <div className="text-xs font-bold text-red-400 mb-1">PRESCRIPTION:</div>
                      <div className="text-sm italic opacity-80">"{retentionAnalysis.improvement}"</div>
                    </div>
                  </div>
                )}

                {videoAnalysis && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 bg-muted/20 border rounded-xl">
                      <div className="text-xs uppercase font-bold text-muted-foreground">Key Takeaway</div>
                      <div>{videoAnalysis.actionableTakeaway}</div>
                    </div>
                  </div>
                )}
                {!videoAnalysis && !retentionAnalysis && <div className="text-center opacity-50 py-12">Select an analysis protocol above.</div>}

              </div>
            ) : <div className="text-center opacity-50 py-12 border-2 border-dashed rounded-xl">Select a video from the archive.</div>}
          </div>
        </div>
      </div>

      {
        savingInsight && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-2xl border space-y-4">
              <div className="flex justify-between"><h3 className="font-bold">Save Insight</h3><button onClick={() => setSavingInsight(null)}><X className="w-4" /></button></div>
              <input className="w-full bg-muted border px-3 py-2 rounded" value={customWisdomTitle} onChange={e => setCustomWisdomTitle(e.target.value)} />
              <p className="text-sm opacity-70 border p-2 rounded">{savingInsight.description}</p>
              <div className="flex justify-end gap-2"><button onClick={() => setSavingInsight(null)}>Cancel</button><button onClick={saveToWisdom} className="bg-primary text-black px-4 py-2 rounded font-bold">Save</button></div>
            </div>
          </div>
        )
      }
    </div >
  );
}

function InsightCard({ type, item, onSave }: { type: 'win' | 'loss' | 'opportunity', item: InsightItem, onSave: () => void }) {
  // Styles updated for high visibility (larger text, brighter backgrounds)
  const styles = {
    win: "bg-green-500/10 border-green-500/40 text-green-300",
    loss: "bg-red-500/10 border-red-500/40 text-red-300",
    opportunity: "bg-blue-500/10 border-blue-500/40 text-blue-300"
  };
  const labels = { win: "WIN", loss: "LOSS", opportunity: "OPPORTUNITY" };

  return (
    <div className={cn("p-6 rounded-xl border-2 flex gap-4 hover:bg-card/90 transition-all shadow-lg", styles[type])}>
      <div>{type === 'win' ? <CheckCircle className="w-8 h-8" /> : type === 'loss' ? <AlertCircle className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}</div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <h5 className="font-bold uppercase tracking-widest text-sm">{labels[type]}</h5>
          <button onClick={onSave} className="p-1 hover:bg-white/10 rounded transition-colors"><Save className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
        </div>
        <h4 className="font-bold text-xl text-white">{item.title}</h4>
        <p className="text-base opacity-90 leading-relaxed font-medium">{item.description}</p>
      </div>
    </div>
  );
}
