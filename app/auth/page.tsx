"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Preserve any query params like ?mode=signup
    const mode = searchParams?.get('mode');
    if (mode) {
      router.replace(`/?mode=${mode}`);
    } else {
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <AuthRedirect />
    </Suspense>
  );
}
