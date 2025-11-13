import { useEffect } from 'react';

export function ErudaComponent() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('eruda').then(eruda => {
        eruda.default.init();
        eruda.default.show();
      });
    }
  }, []);

  return null;
}