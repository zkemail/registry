import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

export default function Loader() {
  const animationContainer = useRef(null);

  useEffect(() => {
    if (animationContainer.current) {
      lottie.loadAnimation({
        container: animationContainer.current as Element,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/assets/loader.json',
      });
    }
  }, []);

  return <div ref={animationContainer} className="h-16 w-16"></div>;
}
