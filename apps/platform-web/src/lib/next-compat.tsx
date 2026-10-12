import React from 'react';

export function Link({ href, children, ...props }: any) {
  return <a href={href} {...props}>{children}</a>;
}

export default Link;

export const usePathname = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
export const useRouter = () => ({
  push: (url: string) => {
    window.location.href = url;
  },
  replace: (url: string) => {
    window.location.replace(url);
  },
});
