import { useState, useEffect } from 'react';

export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(() => 
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return pathname;
}

export function useRouter() {
  return {
    push: (url: string) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    replace: (url: string) => {
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
  };
}

export function useSearchParams(): URLSearchParams {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => 
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  );

  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return searchParams;
}

export function redirect(url: string): never {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
  throw new Error(`Redirecting to ${url}`);
}
