import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_IMAGE = "/bg-desk.jpg";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: carouselItems } = useQuery({
    queryKey: ["about-carousel"],
    queryFn: () => api.aboutCarousel.list(),
  });

  const images = carouselItems && carouselItems.length > 0
    ? carouselItems.map((item) => item.imageUrl)
    : [DEFAULT_IMAGE];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        notebookRef.current,
        { y: 100, rotation: -3, opacity: 0 },
        {
          y: 0,
          rotation: -1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        textRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  const hasCarousel = carouselItems && carouselItems.length > 0;

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden bg-[#FEF9E7]"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={notebookRef}
          className="bg-white rounded-3xl neo-border neo-shadow"
          style={{ transform: "rotate(-1deg)" }}
        >
          {/* Sticky notes on top */}
          <div className="relative h-14 pt-3">
            <div className="absolute top-3 left-8 sm:left-16 bg-yellow-400 px-4 py-2 rounded-lg neo-border neo-shadow-sm font-mono-type text-xs font-bold tracking-wider animate-float">
              ON AIR
            </div>
            <div
              className="absolute top-4 left-32 sm:left-48 bg-blue-400 text-white px-4 py-2 rounded-lg neo-border neo-shadow-sm font-mono-type text-xs font-bold tracking-wider animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              About Me
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 sm:p-12">
            {/* Text Content */}
            <div ref={textRef} className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                关于我的频道
              </h2>
              <div className="w-16 h-1 bg-yellow-400 rounded-full" />
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                这里没有刻意的脚本，只有突如其来的小确幸和对这个世界的好奇。无论是路边的一朵野花，还是深夜的一段旋律，都值得被按下快门或记录下来。
              </p>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                欢迎来到我的「慢半拍」生活频道。在这个快节奏的世界里，我想和你一起找到属于自己的节奏。
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-medium rounded-xl neo-border hover:bg-blue-600 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  阅读博文
                </Link>
                <Link
                  to="/journal"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 font-medium rounded-xl neo-border neo-shadow-sm hover:bg-gray-50 transition-colors"
                >
                  查看日志
                </Link>
              </div>
            </div>

            {/* Photo Carousel */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-xs">
                <div className="bg-white p-3 rounded-2xl neo-border neo-shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                    {images.map((src, idx) => (
                      <img
                        key={`${src}-${idx}`}
                        src={src}
                        alt="生活记录"
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                          idx === currentIndex ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-center text-sm text-gray-500 font-mono-type">
                    #生活碎片 #记录日常
                  </p>
                </div>

                {/* Tape decoration */}
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-200/80 rounded-sm"
                  style={{ transform: "translateX(-50%) rotate(-2deg)" }}
                />

                {/* Carousel controls */}
                {hasCarousel && images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 flex items-center justify-center bg-white rounded-full neo-border neo-shadow-sm hover:bg-yellow-50 transition-colors"
                      aria-label="上一张"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 flex items-center justify-center bg-white rounded-full neo-border neo-shadow-sm hover:bg-yellow-50 transition-colors"
                      aria-label="下一张"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="flex justify-center gap-1.5 mt-4">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentIndex ? "bg-blue-500" : "bg-gray-300"
                          }`}
                          aria-label={`切换到第 ${idx + 1} 张`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
