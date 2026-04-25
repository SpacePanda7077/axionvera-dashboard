import type { AppProps } from "next/app";
import { Toaster } from 'sonner';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { initTelemetry } from "@/utils/telemetry";

// Import the correct ThemeProvider - choose one based on your needs
// Option 1: If you want to use next-themes for theme switching
// Option 2: If you want to use your custom ThemeContext

// For this fix, I'll assume you want to use both:
// - next-themes for the main theme management
// - Your custom ThemeContext for additional theme logic

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AppThemeProvider>
        {children}
      </AppThemeProvider>
    </NextThemeProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <ThemeProvider>
          <WalletProvider>
            <Component {...pageProps} />
            <ThemeToggle />
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </WalletProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}