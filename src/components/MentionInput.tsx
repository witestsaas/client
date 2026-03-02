"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Users } from "lucide-react";
import { apiFetch } from "../services/http";

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

interface MentionUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  organizationSlug: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Add a comment...",
  organizationSlug,
  className,
  disabled = false,
  rows = 1
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [allMembers, setAllMembers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all org members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/organizations/${organizationSlug}/members?excludeSelf=true`);
        if (res.ok) {
          const data = await res.json();
          const members = Array.isArray(data) ? data : (data.members || []);
          const normalized = members.map((m: any) => ({
            ...m,
            fullName: m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email?.split("@")[0] || "Unknown",
            email: m.email || "",
          }));
          setAllMembers(normalized);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationSlug) {
      fetchMembers();
    }
  }, [organizationSlug]);

  // Filter suggestions based on query
  useEffect(() => {
    if (!mentionQuery) {
      // Show @everyone + all members when just typed @
      const everyoneOption: MentionUser = {
        id: "everyone",
        firstName: "everyone",
        lastName: "",
        fullName: "everyone",
        email: "",
        avatarUrl: null,
        role: "all"
      };
      setSuggestions([everyoneOption, ...allMembers]);
    } else {
      const query = mentionQuery.toLowerCase();
      const filtered = allMembers.filter(
        m =>
          m.firstName.toLowerCase().includes(query) ||
          m.lastName.toLowerCase().includes(query) ||
          m.fullName.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      );
      
      // Add @everyone if it matches
      if ("everyone".includes(query)) {
        const everyoneOption: MentionUser = {
          id: "everyone",
          firstName: "everyone",
          lastName: "",
          fullName: "everyone",
          email: "",
          avatarUrl: null,
          role: "all"
        };
        setSuggestions([everyoneOption, ...filtered]);
      } else {
        setSuggestions(filtered);
      }
    }
    setSelectedIndex(0);
  }, [mentionQuery, allMembers]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Check if we should show mention suggestions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or after a space
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      
      if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Only show if no space in the query (still typing the mention)
        if (!query.includes(" ") || query.length <= 20) {
          setMentionStart(lastAtIndex);
          setMentionQuery(query);
          setShowSuggestions(true);
          return;
        }
      }
    }
    
    setShowSuggestions(false);
    setMentionStart(null);
    setMentionQuery("");
  };

  const insertMention = useCallback((user: MentionUser) => {
    if (mentionStart === null || !textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPos);
    
    const mentionText = user.id === "everyone" 
      ? "@everyone " 
      : `@${user.fullName} `;
    
    const newValue = beforeMention + mentionText + afterMention;
    onChange(newValue);

    // Reset state
    setShowSuggestions(false);
    setMentionStart(null);
    setMentionQuery("");

    // Focus and move cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [mentionStart, value, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
    }

    // Pass through to parent handler
    onKeyDown?.(e);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={className}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 bottom-full mb-2 left-0 w-full max-h-60 overflow-y-auto",
            "bg-popover rounded-lg shadow-xl",
            "border border-border",
            "py-1"
          )}
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left",
                  "hover:bg-gray-100 dark:hover:bg-slate-800",
                  "transition-colors duration-150",
                  index === selectedIndex && "bg-[#FFAA00]/10 dark:bg-[#FFAA00]/20"
                )}
              >
                {user.id === "everyone" ? (
                  <div className="w-8 h-8 rounded-full bg-[#FFAA00]/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#FFAA00]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FFAA00] text-black text-xs font-semibold inline-flex items-center justify-center">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {user.id === "everyone" ? "@everyone" : `@${user.fullName}`}
                  </div>
                  {user.id !== "everyone" && (
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  )}
                </div>
                {user.id === "everyone" && (
                  <span className="text-xs text-muted-foreground">Notify all members</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
