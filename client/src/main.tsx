import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ParentChildProvider } from "./contexts/ParentChildContext";
import "./index.css";

// Monkey-patch history.pushState to suppress OAuth-related SecurityErrors
// These occur when trying to navigate to cross-origin OAuth URLs (manus.im/app-auth)
// The authentication still works via fallback (window.location.href), so these errors are harmless
const originalPushState = window.history.pushState;
window.history.pushState = function(...args) {
  try {
    return originalPushState.apply(this, args);
  } catch (error) {
    // Suppress SecurityError for OAuth cross-origin navigation
    if (error instanceof DOMException && 
        error.name === 'SecurityError' &&
        args[2]?.toString().includes('manus.im/app-auth')) {
      // Silently ignore - authentication will work via fallback
      console.debug('[OAuth] Cross-origin navigation blocked (expected), using fallback');
      // Return undefined to indicate the operation was handled
      return undefined;
    }
    // Re-throw other errors
    throw error;
  }
};

// Also monkey-patch replaceState for consistency
const originalReplaceState = window.history.replaceState;
window.history.replaceState = function(...args) {
  try {
    return originalReplaceState.apply(this, args);
  } catch (error) {
    if (error instanceof DOMException && 
        error.name === 'SecurityError' &&
        args[2]?.toString().includes('manus.im/app-auth')) {
      console.debug('[OAuth] Cross-origin navigation blocked (expected), using fallback');
      return undefined;
    }
    throw error;
  }
};

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ParentChildProvider>
          <App />
        </ParentChildProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
