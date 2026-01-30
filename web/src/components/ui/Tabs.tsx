'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-900 p-1 text-gray-500",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ className, value, ...props }, ref) => {
    // Note: This is a dumb component. Real tabs need context or state.
    // Since we are using this in address page which currently has no real tabs logic implemented (just placeholder),
    // and I don't want to build a full context system right now without Radix,
    // I will implemented a very basic version that assumes parent controls state if needed,
    // BUT looking at my usage in address page:
    // It's used as: <Tabs defaultValue="account" className="w-full"> ...
    // And standard Radix usage.
    // I will implement a "Look-alike" for now, or use a simple context if I have to.
    
    // Actually, I'll recommend installing radix-ui/react-tabs if possible, but I can't interact.
    // So I'll make a simple Context based one.
    
    return (
        <button
            ref={ref}
            className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            "data-[state=active]:bg-gray-800 data-[state=active]:text-white", 
            className
            )}
            {...props}
        />
    );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

// Simple Context to handle state
import { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{ value: string; setValue: (v: string) => void }>({ value: '', setValue: () => {} });

const TabsRoot = ({ defaultValue, children, className }: { defaultValue: string, children: React.ReactNode, className?: string }) => {
    const [value, setValue] = useState(defaultValue);
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
};

const TabsListImpl = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-gray-900 p-1 text-gray-500", className)}>
            {children}
        </div>
    );
};

const TabsTriggerImpl = ({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) => {
    const context = useContext(TabsContext);
    const isActive = context.value === value;
    return (
        <button
            onClick={() => context.setValue(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-gray-800 text-white shadow-sm" : "hover:bg-gray-800/50 hover:text-gray-300",
                className
            )}
        >
            {children}
        </button>
    );
};

const TabsContentImpl = ({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) => {
    const context = useContext(TabsContext);
    if (context.value !== value) return null;
    return (
        <div className={cn("mt-2", className)}>
            {children}
        </div>
    );
};

export { TabsRoot as Tabs, TabsListImpl as TabsList, TabsTriggerImpl as TabsTrigger, TabsContentImpl as TabsContent };
