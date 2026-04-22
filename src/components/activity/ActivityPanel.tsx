"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SendIcon, ArrowUpIcon, ArrowDownIcon, MessageCircleIcon, ClockIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ActivityItem, ActivityItemSkeleton, ActivityData } from "./ActivityItem";
import { MentionInput } from "@/components/MentionInput";
import { apiFetch } from "@/services/http";

export type ActivityEntityType = "TestPlan" | "TestRun" | "TestRunResult";

interface ActivityPanelProps {
  entityType: ActivityEntityType;
  entityId: string;
  orgSlug: string;
  onClose?: () => void;
  className?: string;
}

type FilterType = "Comment" | "History";

export function ActivityPanel({
  entityType,
  entityId,
  orgSlug,
  onClose,
  className,
}: ActivityPanelProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>("Comment");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      const response = await apiFetch(`/organizations/${orgSlug}/activities?${params}`);
      
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

  // Reset and refetch when entityId changes
  useEffect(() => {
    setActivities([]);
    if (entityId) {
      fetchActivities();
    }
  }, [entityId]);

  // Refetch when filter/sort changes
  useEffect(() => {
    if (entityId) {
      fetchActivities();
    }
  }, [fetchActivities]);

  const handleSubmitComment = async () => {
    if (!comment.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await apiFetch(`/organizations/${orgSlug}/activities`, {
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
        const data = await response.json();
        throw new Error(data.error || "Failed to add comment");
      }

      setComment("");
      fetchActivities();
      
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
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#FFAA00] text-black">
            <MessageCircleIcon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">Activity</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tabs & Sort */}
      <div className="px-3 pt-3 pb-2 space-y-2 border-b border-gray-200 dark:border-slate-700">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="w-full h-8 bg-gray-100 dark:bg-slate-800">
            <TabsTrigger value="Comment" className="flex-1 text-xs h-7 data-[state=active]:bg-[#FFAA00] data-[state=active]:text-black">
              <MessageCircleIcon className="h-3 w-3 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="History" className="flex-1 text-xs h-7 data-[state=active]:bg-[#FFAA00] data-[state=active]:text-black">
              <ClockIcon className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {activities.length} {activities.length === 1 ? "item" : "items"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSort}
            className="text-xs text-muted-foreground hover:text-[#FFAA00] gap-1 h-6 px-2 rounded-md transition-colors cursor-pointer"
          >
            {sortOrder === "newest" ? (
              <>
                <ArrowDownIcon className="h-3 w-3" />
                Newest
              </>
            ) : (
              <>
                <ArrowUpIcon className="h-3 w-3" />
                Oldest
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="space-y-1 p-2">
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="mt-2 h-7 text-xs"
            >
              Try again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-slate-800 mb-3">
              <MessageCircleIcon className="h-6 w-6 text-gray-400 dark:text-slate-500" />
            </div>
            <p className="text-xs font-medium text-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Be the first to comment!
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
        <div className="p-3 border-t border-border bg-muted rounded-b-lg">
          <div className="flex items-end gap-2">
            <Button
              onClick={handleSubmitComment}
              disabled={!comment.trim() || submitting}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg flex-shrink-0",
                "flex items-center justify-center",
                "bg-[#FFAA00] hover:bg-[#F4A200]",
                "text-black shadow-sm",
                "disabled:opacity-50 disabled:shadow-none",
                "transition-all duration-200 cursor-pointer"
              )}
            >
              {submitting ? (
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SendIcon className="h-3.5 w-3.5" />
              )}
            </Button>
            <MentionInput
              value={comment}
              onChange={setComment}
              onKeyDown={handleKeyDown}
              placeholder="Comment... @ to mention"
              organizationSlug={orgSlug}
              className={cn(
                "flex-1 resize-none rounded-lg px-3 py-2",
                "bg-card",
                "border border-gray-200 dark:border-slate-700",
                "focus:border-[#FFAA00] dark:focus:border-[#FFAA00]",
                "focus:ring-2 focus:ring-[#FFAA00]/20",
                "outline-none transition-all duration-200",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "min-h-[36px] max-h-[100px]"
              )}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-foreground font-mono text-[10px]">Ctrl+Enter</kbd> to send • <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-foreground font-mono text-[10px]">@</kbd> to mention
          </p>
        </div>
      )}
    </div>
  );
}
