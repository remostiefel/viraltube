"use client";

import { Users, Eye, Sparkles, AlertCircle, RefreshCw, ArrowRight, Brain, Zap, Link as LinkIcon, Lock, Film, CheckCircle, Save, X, Activity, Stethoscope, HeartPulse as HeartPulseIcon, ChevronRight, Target, Lightbulb, ThumbsUp, Magnet, Percent } from "lucide-react";
import { fetchAnalyticsAction, fetchChannelInsights, fetchEnhancedChannelVideosAction, analyzeViralVideoAction, generateChannelAuditAction, saveTemplateAction, analyzeHookRetentionAction, generateMetricOptimizationAction } from "@/app/actions";
import { getAuthUrl } from "@/lib/google-oauth";
import { useEffect, useState, useMemo } from "react";
import { ChannelData, OutlierVideo } from "@/lib/youtube";
import { ViralAnalysisResult } from "@/lib/openai";
import { AnalyticsData, calculateSatisfactionScore, calculateQCR, calculateZombieScore } from "@/lib/youtube-analytics";
import { ChannelAuditResult, InsightItem, RetentionAnalysis, MetricOptimizationResult } from "@/lib/gemini";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { saveReport, getReports, deleteReport, SavedReport, exportReport } from "@/lib/reports";
import { FileText, Download, Trash2, CheckSquare, Square } from "lucide-react";
import { extractInsightsFromFullScan, extractInsightsFromSurgeonReport, extractInsightsFromChannelAudit, WisdomCandidate } from "@/lib/wisdom-extractor";
import { InsightHarvester } from "@/components/analytics/InsightHarvester";

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
  const [auditMode, setAuditMode] = useState<'medical' | 'professional'>('medical');

  // METRIC DRILL DOWN STATE
  const [selectedMetric, setSelectedMetric] = useState<{ name: string, value: string, color: string, icon: any } | null>(null);
  const [optimizingMetric, setOptimizingMetric] = useState(false);
  const [metricStrategy, setMetricStrategy] = useState<MetricOptimizationResult | null>(null);

  const openMetricModal = (name: string, value: string, color: string, icon: any) => {
    setSelectedMetric({ name, value, color, icon });
    setMetricStrategy(null); // Reset previous strategy
  };

  const closeMetricModal = () => {
    setSelectedMetric(null);
    setOptimizingMetric(false);
  };

  const handleOptimizeMetric = async () => {
    if (!selectedMetric) return;
    setOptimizingMetric(true);
    try {
      const result = await generateMetricOptimizationAction(selectedMetric.name, selectedMetric.value, stats?.id);
      setMetricStrategy(result);
    } catch (e) {
      console.error(e);
      setNotification({ message: "Optimization Failed", type: 'error' });
    } finally {
      setOptimizingMetric(false);
    }
  };

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

  // INSIGHT HARVESTER
  const [harvesterOpen, setHarvesterOpen] = useState(false);
  const [harvestedInsights, setHarvestedInsights] = useState<WisdomCandidate[]>([]);
  const [harvesterSourceTitle, setHarvesterSourceTitle] = useState("");

  // VIDEO SORTING
  const [sortBy, setSortBy] = useState<"views" | "likes" | "avd" | "retention" | "date">("views");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const sortedVideos = useMemo(() => {
    return [...recentVideos].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case "views":
          valA = a.viewCount || 0;
          valB = b.viewCount || 0;
          break;
        case "likes":
          valA = a.likeCount || 0;
          valB = b.likeCount || 0;
          break;
        case "avd":
          valA = a.averageViewPercentage || 0;
          valB = b.averageViewPercentage || 0;
          break;
        case "retention":
          valA = a.averageViewDuration || 0;
          valB = b.averageViewDuration || 0;
          break;
        case "date":
          valA = new Date(a.publishedAt).getTime();
          valB = new Date(b.publishedAt).getTime();
          break;
      }

      return sortOrder === "desc" ? valB - valA : valA - valB;
    });
  }, [recentVideos, sortBy, sortOrder]);

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
      views = recentVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
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
    const mockLikes = analytics ? analytics.likes : views * 0.04;
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
      // Use enhanced fetch to get private analytics (AVD, etc.) if token exists
      const token = localStorage.getItem("nc_google_access_token");
      const videos = await fetchEnhancedChannelVideosAction(token);
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

      const result = await generateChannelAuditAction(safeAnalytics!, recentVideos, auditMode);

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
    console.log('[Full Scan] Starting analysis for video:', selectedVideo.id);
    try {
      const url = `https://www.youtube.com/watch?v=${selectedVideo.id}`;
      console.log('[Full Scan] Calling analyzeViralVideoAction with URL:', url);
      const result = await analyzeViralVideoAction(url);
      console.log('[Full Scan] Result received:', result);

      // Check for error response
      if (result && 'error' in result) {
        console.error('[Full Scan] Error from API:', result.error);
        alert(`Full Scan Fehler: ${result.error}`);
        return;
      }

      if (result && 'viralScore' in result) {
        const viralResult = result as ViralAnalysisResult;
        console.log('[Full Scan] Setting videoAnalysis state:', viralResult);
        setVideoAnalysis(viralResult);

        // Save Report
        const sentiment = viralResult.viralScore > 7 ? "positive" : viralResult.viralScore < 5 ? "negative" : "neutral";
        saveReport({
          type: "FULL_SCAN",
          title: `Full Scan: ${selectedVideo.title.slice(0, 30)}...`,
          summary: `Viral Score: ${viralResult.viralScore}/10 | Target: ${viralResult.targetAudience} | ${viralResult.actionableTakeaway}`,
          data: viralResult,
          sentiment: sentiment,
          sourceId: selectedVideo.id
        });
        refreshReports();
        console.log('[Full Scan] Report saved and UI refreshed');
      } else {
        console.error('[Full Scan] Invalid result structure:', result);
        alert('Full Scan Fehler: Ungültige Antwort vom Server');
      }
    } catch (e) {
      console.error('[Full Scan] Exception:', e);
      alert(`Full Scan Fehler: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAnalyzingVideo(false);
      console.log('[Full Scan] Analysis complete, analyzingVideo set to false');
    }
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

  // INSIGHT HARVESTER HANDLERS
  const openHarvesterFromFullScan = () => {
    if (!videoAnalysis || !selectedVideo) return;
    const insights = extractInsightsFromFullScan(videoAnalysis, selectedVideo.id, selectedVideo.title);
    setHarvestedInsights(insights);
    setHarvesterSourceTitle(selectedVideo.title);
    setHarvesterOpen(true);
  };

  const openHarvesterFromSurgeon = () => {
    if (!retentionAnalysis || !selectedVideo) return;
    const insights = extractInsightsFromSurgeonReport(retentionAnalysis, selectedVideo.id, selectedVideo.title);
    setHarvestedInsights(insights);
    setHarvesterSourceTitle(selectedVideo.title);
    setHarvesterOpen(true);
  };

  const openHarvesterFromAudit = () => {
    if (!audit) return;
    const insights = extractInsightsFromChannelAudit(audit);
    setHarvestedInsights(insights);
    setHarvesterSourceTitle("Channel Audit");
    setHarvesterOpen(true);
  };

  const handleHarvesterClose = () => {
    setHarvesterOpen(false);
    setNotification({ message: "Insights added to Pending Review!", type: 'success' });
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
            <Activity className="w-8 h-8 text-primary" /> Vital Signs
          </h2>
          <p className="text-muted-foreground mt-2">Neuro-Code Biometric Monitor.</p>
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

        {/* DASHBOARD GRID (CHANNEL PULSE) - UNIFIED 5 TILES */}
        <div className="space-y-6">
          {!isConnected && <div className="p-4 bg-muted/30 border rounded-xl font-bold text-sm text-center">Connect for Real CORTEX Metrics. (Currently Simulated)</div>}

          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-5 h-5" /> Neuro-Code Vital Signs
            </h3>
            <div className="flex items-center gap-3">
              {/* Audit Mode Toggle */}
              {!audit && !auditing && (
                <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                  <button
                    onClick={() => setAuditMode('medical')}
                    className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all flex gap-1 items-center", auditMode === 'medical' ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5")}
                  >
                    <Stethoscope className="w-3 h-3" /> Medical
                  </button>
                  <button
                    onClick={() => setAuditMode('professional')}
                    className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all flex gap-1 items-center", auditMode === 'professional' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "text-muted-foreground hover:bg-white/5")}
                  >
                    <Activity className="w-3 h-3" /> Growth
                  </button>
                </div>
              )}

              <div className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 animate-pulse">
                System Active
              </div>
              {!audit && !auditing && (
                <button
                  onClick={handleRunAudit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg flex gap-2 items-center text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-4 h-4" /> {auditMode === 'medical' ? "DIAGNOSTIC SCAN" : "GROWTH AUDIT"}
                </button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-2xl p-6 min-h-[150px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {!audit && !auditing && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 opacity-100 z-10 relative">

                {/* 1. OXYGEN (Traffic/Views) */}
                <div
                  onClick={() => openMetricModal("Oxygen (Views)", analytics ? analytics.views.toLocaleString() : "---", "text-blue-500", Activity)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Oxygen (Traffic)</div>
                    <Activity className="w-4 h-4 text-blue-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                        {analytics ? analytics.views.toLocaleString() : (recentVideos.length > 0) ? recentVideos.reduce((acc, v) => acc + v.viewCount, 0).toLocaleString() : "---"}
                      </div>
                      {(analytics || recentVideos.length > 0) && (
                        <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {analytics
                            ? `+${Math.round(analytics.views / 4.3).toLocaleString()}`
                            : `+${recentVideos.filter(v => new Date(v.publishedAt) > new Date(Date.now() - 7 * 86400000)).reduce((acc, v) => acc + v.viewCount, 0).toLocaleString()}`}
                          /wk
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-blue-400 mt-1 flex items-center gap-1 opacity-80">
                      {(analytics || recentVideos.length > 0) ? "Flow Rate Stable" : "Hypoxia Risk"}
                    </div>
                  </div>
                </div>

                {/* 2. HEARTRATE (Consistency) */}
                <div
                  onClick={() => openMetricModal("Pulse (Consistency)", (stats?.statistics?.videoCount || "---") + " Vids", "text-red-500", HeartPulseIcon)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Pulse (Consistency)</div>
                    <HeartPulseIcon className="w-4 h-4 text-red-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-mono font-black text-white drop-shadow-sm">{stats?.statistics?.videoCount || recentVideos.length || "---"} Vids</div>
                      <div className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        {recentVideos.filter(v => new Date(v.publishedAt) > new Date(Date.now() - 30 * 86400000)).length} / 30d
                      </div>
                    </div>
                    <div className="text-xs font-bold text-red-400 mt-1 opacity-80">
                      Rhythm Check: {recentVideos.filter(v => new Date(v.publishedAt) > new Date(Date.now() - 7 * 86400000)).length > 0 ? "Regular" : "Arrhythmia"}
                    </div>
                  </div>
                </div>

                {/* 3. BRAINWAVES (Retention) */}
                <div
                  onClick={() => openMetricModal("Alpha Waves (Retention)", analytics ? Math.round(analytics.averageViewDuration) + "s" : "---", "text-purple-500", Brain)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Alpha Waves (AVD)</div>
                    <Brain className="w-4 h-4 text-purple-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                        {analytics ? Math.round(analytics.averageViewDuration) + "s" :
                          (recentVideos.length > 0) ? (recentVideos.reduce((acc, v) => acc + v.viewCount, 0) / recentVideos.length > 10000 ? "120s" : "45s") : "---"}
                      </div>
                      <div className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        {analytics
                          ? Math.min(100, Math.round((analytics.averageViewDuration / 600) * 100))
                          : Math.round((45 / 120) * 100)}% (Est. 10m)
                      </div>
                    </div>
                    <div className="text-xs font-bold text-purple-400 mt-1 opacity-80">
                      Attention Span: {analytics ? "Measured" : "Est. Short"}
                    </div>
                  </div>
                </div>

                {/* 4. DOPAMINE (Quality) */}
                <div
                  onClick={() => openMetricModal("Dopamine (Quality)", cortexMetrics?.satisfaction.score ? String(cortexMetrics.satisfaction.score) : "---", "text-green-500", Zap)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Dopamine (QCR)</div>
                    <Zap className="w-4 h-4 text-green-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                          {cortexMetrics?.satisfaction.score || "---"}
                        </div>
                        <div className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                          Grade: {cortexMetrics?.satisfaction.grade || "-"}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-green-400 mt-1 opacity-80 flex gap-2">
                        <span>Sentiment: {cortexMetrics?.satisfaction.sentiment || "Neutral"}</span>
                        <span className="text-white/20">|</span>
                        <span>Avg IQ: {recentVideos.length > 0 ? (recentVideos.reduce((acc, v) => acc + v.outlierScore, 0) / recentVideos.length).toFixed(1) : "-"}x</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. CELLS (Sudience/Subs) */}
                <div
                  onClick={() => openMetricModal("Cells (Community)", stats?.statistics?.subscriberCount ? Number(stats.statistics.subscriberCount).toLocaleString() : "---", "text-yellow-500", Users)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">Cells (Audience)</div>
                    <Users className="w-4 h-4 text-yellow-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                          {stats?.statistics?.subscriberCount ? Number(stats.statistics.subscriberCount).toLocaleString() : "---"}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-yellow-400 mt-1 opacity-80">
                        Zombie Ratio: {cortexMetrics ? (cortexMetrics.activeRatio * 100).toFixed(1) + "% Active" : "---"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. METABOLISM (Watch Time) - NEW */}
                <div
                  onClick={() => openMetricModal("Metabolism (Energy)", analytics ? Math.round(analytics.estimatedMinutesWatched / 60) + "h" : "---", "text-orange-500", Activity)}
                  className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all group cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-orange-300 uppercase tracking-widest">Metabolism (Energy)</div>
                    <Activity className="w-4 h-4 text-orange-400 opacity-50" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-mono font-black text-white drop-shadow-sm">
                          {analytics ? Math.round(analytics.estimatedMinutesWatched / 60).toLocaleString() + "h" : "---"}
                        </div>
                        {(analytics || recentVideos.length > 0) && (
                          <div className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                            {analytics
                              ? `+${Math.round((analytics.estimatedMinutesWatched / 60) / 4.3).toLocaleString()}h`
                              : "---"}/wk
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold text-orange-400 mt-1 opacity-80">
                        Total Energy Burned
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {auditing && <div className="flex-1 flex items-center justify-center animate-pulse font-bold py-12">Auditing Channel Data...</div>}

            {audit && (
              <div className="space-y-6 animate-in fade-in pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold uppercase text-primary mb-2">Diagnostic Result</h4>
                    <p className={cn("text-lg font-medium p-4 rounded-lg border",
                      audit.executiveSummary.toLowerCase().includes("failed")
                        ? "bg-red-500/10 border-red-500/30 text-red-200"
                        : "bg-background/40 border-white/10"
                    )}>
                      {audit.executiveSummary}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 rounded-lg whitespace-nowrap">{audit.overallSentiment}</div>
                </div>
                <div className="space-y-3">
                  {audit.wins.map((item, i) => <InsightCard key={i} type="win" item={item} onSave={() => openSaveDialog(item)} />)}
                  {audit.opportunities.map((item, i) => <InsightCard key={i} type="opportunity" item={item} onSave={() => openSaveDialog(item)} />)}
                  {audit.losses.map((item, i) => <InsightCard key={i} type="loss" item={item} onSave={() => openSaveDialog(item)} />)}
                </div>

                {/* Harvest Insights Button */}
                <button
                  onClick={openHarvesterFromAudit}
                  className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Harvest Growth Patterns
                </button>

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

        {/* Sorting Controls */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground font-bold uppercase">Sort by:</span>
          {[
            { key: "views", label: "Views", icon: Eye },
            { key: "likes", label: "Likes", icon: ThumbsUp },
            { key: "date", label: "Date", icon: Film }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                if (sortBy === key) {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy(key as any);
                  setSortOrder("desc");
                }
              }}
              className={cn(
                "px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1",
                sortBy === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
              {sortBy === key && (
                <span className="ml-1">{sortOrder === "desc" ? "↓" : "↑"}</span>
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedVideos.map(video => (
              <div
                key={video.id}
                onClick={() => handleAnalyzeVideo(video)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer hover:bg-card/80 transition-all relative overflow-hidden",
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

                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <img src={video.thumbnailUrl} className="w-32 h-20 object-cover rounded-md bg-black flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold line-clamp-2">{video.title}</h4>

                    {/* 2 Key Stats Grid - Views & Likes Only */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Views */}
                      <div className="bg-blue-500/10 p-1.5 rounded text-center">
                        <div className="text-[9px] text-blue-400/70 uppercase font-bold">Views</div>
                        <div className="text-xs font-mono font-bold text-blue-400">
                          {video.viewCount >= 1000
                            ? `${(video.viewCount / 1000).toFixed(1)}K`
                            : video.viewCount}
                        </div>
                      </div>

                      {/* Likes */}
                      <div className="bg-pink-500/10 p-1.5 rounded text-center">
                        <div className="text-[9px] text-pink-400/70 uppercase font-bold">Likes</div>
                        <div className="text-xs font-mono font-bold text-pink-400">
                          {video.likeCount !== undefined && video.likeCount > 0
                            ? video.likeCount >= 1000
                              ? `${(video.likeCount / 1000).toFixed(1)}K`
                              : video.likeCount
                            : "—"}
                        </div>
                      </div>



                    </div>
                  </div>
                </div>
              </div>

            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedVideo ? (
              <div className="bg-card border border-border/40 rounded-2xl p-6 min-h-[400px]">
                <div className="flex gap-6 mb-6 pb-6 border-b">
                  <div className="space-y-4">
                    <img src={selectedVideo.thumbnailUrl} className="w-48 rounded-xl shadow-lg" />
                    {/* 2 KEY STAT BOXES */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-500/10 p-2 rounded text-center">
                        <div className="text-[8px] text-blue-400 font-bold uppercase">Views</div>
                        <div className="text-xs font-mono font-bold text-blue-400">
                          {selectedVideo.viewCount >= 1000 ? `${(selectedVideo.viewCount / 1000).toFixed(1)}K` : selectedVideo.viewCount}
                        </div>
                      </div>
                      <div className="bg-pink-500/10 p-2 rounded text-center">
                        <div className="text-[8px] text-pink-400 font-bold uppercase">Likes</div>
                        <div className="text-xs font-mono font-bold text-pink-400">
                          {selectedVideo.likeCount && selectedVideo.likeCount > 0
                            ? (selectedVideo.likeCount >= 1000 ? `${(selectedVideo.likeCount / 1000).toFixed(1)}K` : selectedVideo.likeCount)
                            : "—"}
                        </div>
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
                      <h4 className="font-bold text-red-500 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> CHIRURGEN-BERICHT</h4>
                      <div className="text-xs font-bold uppercase bg-red-500/10 px-2 py-1 rounded">Risiko: {retentionAnalysis.dropOffRisk}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Hook-Score</div>
                        <div className="text-2xl font-mono font-bold">{retentionAnalysis.hookScore}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Primärer Trigger</div>
                        <div className="font-bold">{retentionAnalysis.triggerUsed}</div>
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-red-500/10">
                      <div className="text-xs font-bold text-red-400 mb-1">VERSCHREIBUNG:</div>
                      <div className="text-sm italic opacity-80">"{retentionAnalysis.improvement}"</div>
                    </div>

                    {/* Harvest Insights Button */}
                    <button
                      onClick={openHarvesterFromSurgeon}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      <Sparkles className="w-4 h-4" />
                      Harvest Insights
                    </button>
                  </div>
                )}

                {videoAnalysis && (
                  <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-blue-500 flex items-center gap-2"><Brain className="w-4 h-4" /> VOLLSTÄNDIGER SCAN-BERICHT</h4>
                      <div className="text-xs font-bold uppercase bg-blue-500/10 px-2 py-1 rounded">Viral-Score: {videoAnalysis.viralScore}/10</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Zielgruppe</div>
                        <div className="font-bold">{videoAnalysis.targetAudience}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Hook-Qualität</div>
                        <div className="font-bold text-sm line-clamp-2">{videoAnalysis.hookAnalysis}</div>
                      </div>
                    </div>

                    {/* Sentiments */}
                    {videoAnalysis.sentiments && videoAnalysis.sentiments.length > 0 && (
                      <div className="bg-background/50 p-3 rounded-lg border border-blue-500/10">
                        <div className="text-xs font-bold text-blue-400 mb-2">SCHLÜSSEL-EMOTIONEN:</div>
                        <div className="flex flex-wrap gap-2">
                          {videoAnalysis.sentiments.map((sentiment, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-300 rounded text-xs font-bold">
                              {sentiment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actionable Takeaway */}
                    <div className="bg-background/50 p-3 rounded-lg border border-blue-500/10">
                      <div className="text-xs font-bold text-blue-400 mb-1">UMSETZBARE ERKENNTNIS:</div>
                      <div className="text-sm italic opacity-80">"{videoAnalysis.actionableTakeaway}"</div>
                    </div>

                    {/* Wordwall - Top 3 Concepts */}
                    {videoAnalysis.wordwall && videoAnalysis.wordwall.length > 0 && (
                      <div className="bg-background/50 p-3 rounded-lg border border-blue-500/10">
                        <div className="text-xs font-bold text-blue-400 mb-2">TOP 3 SCHLÜSSELKONZEPTE:</div>
                        <div className="space-y-2">
                          {videoAnalysis.wordwall.slice(0, 3).map((item, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-bold text-blue-300">{item.keyword}:</span>{" "}
                              <span className="opacity-80">{item.explanation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Harvest Insights Button */}
                    <button
                      onClick={openHarvesterFromFullScan}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      <Sparkles className="w-4 h-4" />
                      Harvest Insights
                    </button>
                  </div>
                )}
                {!videoAnalysis && !retentionAnalysis && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                    <div className="p-4 bg-muted rounded-full">
                      <Stethoscope className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Detailed Analysis Ready</h4>
                      <p className="text-sm max-w-[200px]">Select any tool above to begin deep diagnostic scan.</p>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-card/30 border border-border/40 border-dashed rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Film className="w-16 h-16 text-muted-foreground relative z-10" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-bold text-white">No Video Selected</h3>
                  <p className="text-muted-foreground">Select a video from the list on the left to inspect its vital signs, run a viral scan, or perform a retention surgery.</p>
                </div>
                <div className="flex gap-2 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
                  <span>waiting for input</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            )}
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

      {/* INSIGHT HARVESTER MODAL */}
      <InsightHarvester
        insights={harvestedInsights}
        open={harvesterOpen}
        onClose={handleHarvesterClose}
        sourceTitle={harvesterSourceTitle}
      />

      {/* METRIC OPTIMIZATION MODAL - RESTORED TO CORRECT SCOPE */}
      {
        selectedMetric && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={closeMetricModal}>
            <div className="bg-card border border-border/60 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border/40 flex justify-between items-start bg-muted/20">
                <div className="flex gap-4 items-center">
                  <div className={cn("p-3 rounded-xl bg-background border border-white/10 shadow-inner", selectedMetric.color.replace('text-', 'bg-').replace('500', '500/20'))}>
                    <selectedMetric.icon className={cn("w-8 h-8", selectedMetric.color)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedMetric.name}</h3>
                    <div className="text-sm text-muted-foreground font-mono">Current Level: <span className="text-foreground font-bold">{selectedMetric.value}</span></div>
                  </div>
                </div>
                <button onClick={closeMetricModal} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 opacity-70" /></button>
              </div>

              <div className="p-6 space-y-6">
                {!metricStrategy ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 flex flex-col items-center text-center gap-4">
                      <Target className="w-12 h-12 text-primary opacity-80" />
                      <div>
                        <h4 className="font-bold text-lg">Neuro-Optimization Protocol</h4>
                        <p className="text-sm text-muted-foreground max-w-md">Generate a specialized strategic plan to boost your <span className="font-semibold text-primary">{selectedMetric.name.split(' ')[0]}</span>.</p>
                      </div>
                      <button
                        onClick={handleOptimizeMetric}
                        disabled={optimizingMetric}
                        className={cn("px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all",
                          optimizingMetric ? "bg-muted text-muted-foreground cursor-wait" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105")}
                      >
                        {optimizingMetric ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {optimizingMetric ? "Analyzing Vital Signs..." : "GENERATE GROWTH STRATEGY"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="p-3 bg-muted/30 rounded-lg">🔎 Analyzes historical performance</div>
                      <div className="p-3 bg-muted/30 rounded-lg">🧠 Uses Neuro-Marketing Psychology</div>
                      <div className="p-3 bg-muted/30 rounded-lg">🎯 Provides 3 concrete tactics</div>
                      <div className="p-3 bg-muted/30 rounded-lg">🇩🇪 Returns localized German strategy</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Strategic Treatment Plan</h4>
                      <span className="text-xs font-mono text-muted-foreground">AI-Generated • {new Date().toLocaleTimeString()}</span>
                    </div>

                    <div className="grid gap-3">
                      {metricStrategy.tactics.map((tactic, i) => (
                        <div key={i} className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all">
                          <div className="flex justify-between mb-2">
                            <div className="font-bold text-primary">{tactic.title}</div>
                            <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                              tactic.difficulty === 'Easy' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                tactic.difficulty === 'Medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                              {tactic.difficulty}
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80">{tactic.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400 mt-4">
                      <span className="font-bold">Predicted Impact:</span> {metricStrategy.impactPrediction}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
