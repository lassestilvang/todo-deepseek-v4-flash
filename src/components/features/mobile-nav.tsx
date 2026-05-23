"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CalendarRange,
  Layers,
  ListTodo,
  Menu,
  X,
  LayoutList,
  Tag,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTaskCounts, useListCache, useLabelCache } from "@/hooks/use-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const items = [
  { id: "today", label: "Today", icon: Calendar, href: "/today" },
  {
    id: "next-7-days",
    label: "7 Days",
    icon: CalendarRange,
    href: "/next-7-days",
  },
  { id: "upcoming", label: "Upcoming", icon: Layers, href: "/upcoming" },
  { id: "all", label: "All", icon: ListTodo, href: "/all" },
];

const springTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

export function MobileNav() {
  const pathname = usePathname();
  const { counts } = useTaskCounts();
  const { lists } = useListCache();
  const { labels } = useLabelCache();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  const createList = async () => {
    if (!newListName.trim()) return;
    const colors = [
      "#d97706",
      "#059669",
      "#6366f1",
      "#dc2626",
      "#7c3aed",
      "#db2777",
      "#0284c7",
    ];
    const icons = ["📋", "🎯", "⭐", "💼", "🏠", "📚", "🎨", "💪", "🎵", "✈️"];
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newListName,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      }),
    });
    setNewListName("");
    setShowNewList(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-xl z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const count =
              item.id === "today"
                ? counts.today
                : item.id === "next-7-days"
                  ? counts.next7Days
                  : item.id === "upcoming"
                    ? counts.upcoming
                    : counts.total;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[64px] active:scale-90",
                  active
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="mobileIndicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={springTransition}
                  />
                )}
                <div className="relative">
                  <Icon className="h-5 w-5 relative" />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -top-1 -right-1.5 w-2 h-2 rounded-full",
                        active ? "bg-primary" : "bg-primary/60",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium relative",
                    active ? "font-semibold" : "",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[64px] active:scale-90 text-muted-foreground/50 hover:text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[300px] max-w-[85vw] bg-background border-l shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">
                  <span className="text-primary">Planner</span>
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <div className="flex items-center justify-between px-2 py-1.5 mt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                    <LayoutList className="h-3 w-3" /> Lists
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => setShowNewList(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <AnimatePresence>
                  {showNewList && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          createList();
                        }}
                        className="flex items-center gap-1 px-1 py-1"
                      >
                        <Input
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="List name..."
                          className="h-8 text-sm rounded-lg"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md"
                          onClick={() => setShowNewList(false)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
                {lists.map((list) => {
                  const listCount = counts.byList[list.id] || 0;
                  const active = isActive(`/list/${list.id}`);
                  return (
                    <Link
                      key={list.id}
                      href={`/list/${list.id}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="text-base shrink-0">{list.icon}</span>
                      <span className="flex-1 truncate">{list.name}</span>
                      {listCount > 0 && (
                        <span className="text-[11px] tabular-nums text-muted-foreground/60">
                          {listCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {labels.length > 0 && (
                  <>
                    <div className="flex items-center px-2 py-1.5 mt-4">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                        <Tag className="h-3 w-3" /> Labels
                      </span>
                    </div>
                    {labels.map((label) => {
                      const labelCount = counts.byLabel[label.id] || 0;
                      return (
                        <Link
                          key={label.id}
                          href={`/label/${label.id}`}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                            isActive(`/label/${label.id}`)
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted",
                          )}
                          aria-current={
                            isActive(`/label/${label.id}`) ? "page" : undefined
                          }
                        >
                          <span className="text-base shrink-0">
                            {label.icon}
                          </span>
                          <span className="flex-1 truncate">{label.name}</span>
                          {labelCount > 0 && (
                            <span className="text-[11px] tabular-nums text-muted-foreground/60">
                              {labelCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
