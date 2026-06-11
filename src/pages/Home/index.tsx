import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import exchangeDevelopmentAnimation from "@/assets/animations/exchange-development.json";

export default function Home() {
  const animationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animationRef.current) return;

    const animation = lottie.loadAnimation({
      container: animationRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: exchangeDevelopmentAnimation,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });

    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="flex w-[250px] flex-col items-center">
        <div ref={animationRef} className="h-[210px] w-[270px]" aria-hidden="true" />
        <p className="w-[250px] text-center text-[20px] font-bold leading-[1.1] tracking-[-0.2px] text-white">
          Биржа Rufin пока в разработке
        </p>
      </div>
    </div>
  );
}
