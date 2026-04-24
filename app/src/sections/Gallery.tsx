import { useEffect, useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);

const fallbackImages = [
  { url: "/photo-spring.jpg", description: "「2024年春，家附近的公园樱花盛开。" },
  { url: "/photo-orange.jpg", description: "「极简主义色彩练习，橙子与克莱因蓝的对撞。」" },
  { url: "/photo-sea.jpg", description: "「金色的黄昏，海浪与飞鸟。」" },
  { url: "/photo-autumn.jpg", description: "「铺满落叶的林间小道，秋天独有的温柔。」" },
  { url: "/photo-cat.png", description: "「画了一只打盹的橘猫，希望能给你带来片刻的宁静。」" },
];

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: dbImages } = useQuery({
    queryKey: ["images", "list"],
    queryFn: () => api.images.list(),
  });

  const images = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({ url: img.url, description: img.description || img.title }))
    : fallbackImages;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Horizontal drag
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };
    const onMouseLeave = () => { isDown = false; };
    const onMouseUp = () => { isDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#FEF9C3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400 text-black rounded-full text-xs font-mono-type tracking-wider mb-4 neo-border">
            <Camera className="w-3.5 h-3.5" />
            ARCHIVES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            记忆档案馆
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            拖动浏览，悬停查看背后的故事
          </p>
        </div>
      </div>

      {/* Horizontal Scroll Gallery */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-6 px-4 sm:px-6 lg:px-8 cursor-grab active:cursor-grabbing scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Spacer for centering */}
        <div className="flex-shrink-0 w-4 sm:w-20" />

        {images.map((image, idx) => (
          <div
            key={idx}
            className="gallery-card flex-shrink-0 w-72 sm:w-80 h-48 sm:h-56"
          >
            <div className="gallery-card-inner">
              {/* Front - Image */}
              <div className="gallery-card-front">
                <img
                  src={image.url}
                  alt={image.description || "Gallery image"}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              {/* Back - Description */}
              <div className="gallery-card-back">
                <p className="text-sm font-medium text-center leading-relaxed">
                  {image.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="flex-shrink-0 w-4 sm:w-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-center">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-medium rounded-xl neo-border hover:bg-gray-800 transition-colors"
        >
          查看完整画廊
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
