// Client-side shim for next/headers
export function cookies() {
  return {
    get: (name: string) => {
      if (typeof document === 'undefined') return undefined;
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? { name, value: match[2] } : undefined;
    },
    set: (name: string, value: string, options?: any) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${name}=${value}; path=/`;
    },
    delete: (name: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
  };
}

export function headers() {
  return new Headers();
}
