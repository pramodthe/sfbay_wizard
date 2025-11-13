import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import TopNav from '../components/TopNav';
import ChatAgent from '../components/ChatAgent';
import OfflineBanner from '../components/OfflineBanner';
import { AppProvider } from '../context/AppContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ToastProvider } from '../components/Toast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import '../styles/globals.css';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/auth/callback'];

function AppContent({ Component, pageProps, isPublicRoute }: { Component: any; pageProps: any; isPublicRoute: boolean }) {
  const isOnline = useOnlineStatus();

  return (
    <>
      {isPublicRoute ? (
        // Public routes don't need authentication
        <div className="min-h-screen bg-slate-50">
          <Component {...pageProps} />
        </div>
      ) : (
        // Protected routes require authentication
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-50">
            {!isOnline && <OfflineBanner />}
            <TopNav />
            <Component {...pageProps} />
            <ChatAgent />
          </div>
        </ProtectedRoute>
      )}
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <ToastProvider>
      <AppProvider>
        <Head>
          <title>SmartMoney AI Dashboard</title>
          <meta name="description" content="A modern financial dashboard that provides AI-powered insights and a conversational coach to help you manage your money, track spending, and plan for the future." />
          <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        </Head>
        <AppContent Component={Component} pageProps={pageProps} isPublicRoute={isPublicRoute} />
      </AppProvider>
    </ToastProvider>
  );
}

export default MyApp;
