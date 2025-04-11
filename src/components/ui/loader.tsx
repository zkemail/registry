import { useEffect, useRef, useCallback } from 'react';

export default function Loader() {
  const animationContainer = useRef(null);
  const animationInstance = useRef<any>(null);
  const isInitialized = useRef(false);

  const getLottie = useCallback(async () => {
    const lottie = await import('lottie-web');

    if (!animationContainer.current || isInitialized.current) {
      return;
    }

    animationInstance.current = lottie.default.loadAnimation({
      container: animationContainer.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/loader.json',
    });

    isInitialized.current = true;
  }, []);

  useEffect(() => {
    getLottie();

    return () => {
      if (animationInstance.current) {
        animationInstance.current = null;
      }
    };
  }, []);

  return <div ref={animationContainer} className="h-16 w-16" id="loader" />;
}
