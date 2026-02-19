"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { XIcon, SendIcon, ArrowUpIcon, ArrowDownIcon, MessageCircleIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ActivityItem, ActivityItemSkeleton, ActivityData } from "./ActivityItem";
import { MentionInput } from "@/components/MentionInput";

export type ActivityEntityType = "TestPlan" | "TestRun" | "TestRunResult";

interface ActivitySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ActivityEntityType;
  entityId: string;
  orgSlug: string;
  title?: string;
}

type FilterType = "Comment" | "History";

export function ActivitySidebar({
  isOpen,
  onClose,
  entityType,
  entityId,
  orgSlug,
  title = "Activity",
}: ActivitySidebarProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>("Comment");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        entityType,
        entityId,
        sort: sortOrder === "newest" ? "desc" : "asc",
        type: filter,
      });

      const response = await fetch(`/api/${orgSlug}/activities?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, orgSlug, filter, sortOrder]);

  // Reset activities and refetch when entityId changes
  useEffect(() => {
    setActivities([]);
    if (isOpen && entityId) {
      fetchActivities();
    }
  }, [entityId]);

  // Fetch when sidebar opens
  useEffect(() => {
    if (isOpen && entityId) {
      fetchActivities();
    }
  }, [isOpen, fetchActivities]);

  const handleSubmitComment = async () => {
    if (!comment.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/${orgSlug}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Comment",
          entityType,
          entityId,
          content: comment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      setComment("");
      fetchActivities();
      
      // Auto-resize textarea back to normal
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case "TestPlan":
        return "test plan";
      case "TestRun":
        return "test run";
      case "TestRunResult":
        return "test result";
      default:
        return "item";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[520px] z-50",
          "bg-white dark:bg-slate-900",
          "border-l border-gray-200 dark:border-slate-700",
          "shadow-2xl",
          "flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFAA00] text-black shadow-lg">
              <MessageCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {getEntityTypeLabel()} activity
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs & Sort */}
        <div className="px-4 pt-4 pb-2 space-y-3 border-b border-gray-200 dark:border-slate-700">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="w-full bg-gray-100 dark:bg-slate-800">
              <TabsTrigger value="Comment" className="flex-1 data-[state=active]:bg-[#FFAA00] data-[state=active]:text-black">
                <MessageCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="History" className="flex-1 data-[state=active]:bg-[#FFAA00] data-[state=active]:text-black">
                <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSort}
              className="text-xs text-muted-foreground hover:text-[#FFAA00] gap-1.5"
            >
              {sortOrder === "newest" ? (
                <>
                  <ArrowDownIcon className="h-3.5 w-3.5" />
                  Newest first
                </>
              ) : (
                <>
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                  Oldest first
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Activity List */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-2">
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mb-3">
                <XIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActivities}
                className="mt-3"
              >
                Try again
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
                {filter === "Comment" ? (
                  <MessageCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                ) : filter === "History" ? (
                  <ClockIcon className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                ) : (
                  <MessageCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">
                No {filter === "Comment" ? "comments" : "history"} yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === "Comment"
                  ? "Be the first to add a comment!"
                  : "No history entries to show"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>

        {/* Comment Input - Only show on Comments tab */}
        {filter === "Comment" && (
          <div className="p-4 border-t border-border bg-muted relative z-50">
            <div className="flex items-end gap-3">
              <Button
                onClick={handleSubmitComment}
                disabled={!comment.trim() || submitting}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg flex-shrink-0",
                  "flex items-center justify-center",
                  "bg-[#FFAA00] hover:bg-[#F4A200]",
                  "text-black shadow-lg",
                  "disabled:opacity-50 disabled:shadow-none",
                  "transition-all duration-200"
                )}
              >
                {submitting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
              <MentionInput
                value={comment}
                onChange={setComment}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment... Use @ to mention"
                organizationSlug={orgSlug}
                className={cn(
                  "flex-1 resize-none rounded-xl px-4 py-3",
                  "bg-white dark:bg-slate-900",
                  "border-2 border-gray-200 dark:border-slate-700",
                  "focus:border-[#FFAA00] dark:focus:border-[#FFAA00]",
                  "focus:ring-4 focus:ring-[#FFAA00]/20",
                  "outline-none transition-all duration-200",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "min-h-[44px] max-h-[150px]"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-foreground font-mono text-xs">Ctrl+Enter</kbd> to send • Type <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-foreground font-mono text-xs">@</kbd> to mention
            </p>
          </div>
        )}
      </div>
    </>
  );
}
