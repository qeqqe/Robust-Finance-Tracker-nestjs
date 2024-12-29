"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageContent } from "./components/MessageContent";
import { Send, Trash2, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, FolderPlus } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const getRolePrompt = (role: string): string => {
  const rolePrompts = {
    financialAdvisor: `You are an experienced financial advisor specializing in personal finance, budgeting, and investment strategies. Provide practical financial advice and use relevant financial terminology.`,
    accountant: `You are a certified accountant with expertise in financial reporting, tax planning, and financial analysis. Provide accurate accounting advice using professional terminology.`,
    investmentAnalyst: `You are an investment analyst with deep knowledge of market analysis, portfolio management, and investment strategies. Provide analytical insights using financial market terminology.`,
    budgetCoach: `You are a personal budget coach helping people develop better financial habits and create effective budgeting strategies. Provide practical, actionable advice in a supportive manner.`,
  };

  return (
    rolePrompts[role as keyof typeof rolePrompts] ||
    "I am a helpful finance assistant."
  );
};

export default function Ai() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRole, setAiRole] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      title: string;
      aiRole: string;
    }>
  >([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  const generateChatTitle = (message: string) => {
    return message.split(" ").slice(0, 4).join(" ") + "...";
  };

  const createNewSession = async (role: string) => {
    try {
      const title = `${role} Chat - ${new Date().toLocaleDateString()}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ title, aiRole: role }),
        }
      );

      const session = await response.json();
      setSessions([...sessions, session]);
      setActiveSessionId(session.id);
      return session;
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create new chat session");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/sessions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch sessions");

        const data = await response.json();
        setSessions(data);

        if (data.length > 0) {
          setActiveSessionId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load chat sessions");
      }
    };

    fetchSessions();
  }, []);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.trim()) return;

    let currentMessages = [...messages];

    if (messages.length === 0 || input === "/reset") {
      currentMessages = [{ role: "system", content: getRolePrompt(aiRole) }];
    }

    currentMessages.push({ role: "user", content: input });

    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    if (!activeSessionId) {
      const session = await createNewSession(aiRole);
      if (!session) return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            sessionId: activeSessionId,
            messages: currentMessages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to communicate with AI service"
        );
      }

      let accumulatedContent = "";
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.content) {
                accumulatedContent += data.content;
                setStreamingContent(accumulatedContent);
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }

      if (accumulatedContent) {
        const assistantMessage: Message = {
          role: "assistant",
          content: accumulatedContent.trim(),
        };
        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);
        localStorage.setItem("chatHistory", JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to communicate with the AI service."
      );
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch session messages");

      const data = await response.json();
      setMessages(data.messages);
      setAiRole(data.aiRole);
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load chat session");
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleRoleSelect = async (role: string) => {
    setAiRole(role);
    const session = await createNewSession(role);
    if (session) {
      setActiveSessionId(session.id);
      setMessages([{ role: "system", content: getRolePrompt(role) }]);
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/sessions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch sessions");

        const data = await response.json();
        setSessions(data);

        if (data.length > 0) {
          await handleSessionSelect(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load chat sessions");
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-white">Finance Assistant</CardTitle>
            <Select value={aiRole} onValueChange={handleRoleSelect}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select AI Role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem
                  value="financialAdvisor"
                  className="text-white hover:bg-white/10"
                >
                  Financial Advisor
                </SelectItem>
                <SelectItem
                  value="accountant"
                  className="text-white hover:bg-white/10"
                >
                  Accountant
                </SelectItem>
                <SelectItem
                  value="investmentAnalyst"
                  className="text-white hover:bg-white/10"
                >
                  Investment Analyst
                </SelectItem>
                <SelectItem
                  value="budgetCoach"
                  className="text-white hover:bg-white/10"
                >
                  Budget Coach
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {activeSessionId
                  ? sessions.find((s) => s.id === activeSessionId)?.title
                  : "New Chat"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-white/10 text-white">
              <DropdownMenuItem
                className="hover:bg-white/10"
                onClick={() => handleRoleSelect(aiRole || "financialAdvisor")}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              {sessions.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {sessions.map((session) => (
                    <DropdownMenuItem
                      key={session.id}
                      className={`hover:bg-white/10 ${
                        session.id === activeSessionId ? "bg-white/5" : ""
                      }`}
                      onClick={() => handleSessionSelect(session.id)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {session.title}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4 [&_[data-radix-scroll-area-viewport]]:!block">
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-400/10 text-red-400">
                  {error}
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-4 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-white/90"
                    } ${message.role === "system" ? "bg-white/5 text-sm" : ""}`}
                  >
                    <MessageContent content={message.content} />
                  </div>
                </div>
              ))}

              {streamingContent && isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-lg p-4 max-w-[80%] text-white/90">
                    <MessageContent content={streamingContent} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
