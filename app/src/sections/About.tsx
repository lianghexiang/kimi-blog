import { useEffect, useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Notebook parallax and rotation
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

      // Text content fade in
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

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{
        backgroundImage: "url(/bg-desk.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={notebookRef}
          className="bg-white rounded-3xl neo-border neo-shadow overflow-hidden"
          style={{ transform: "rotate(-1deg)" }}
        >
          {/* Sticky notes on top */}
          <div className="relative h-12">
            <div
              className="absolute -top-3 left-8 sm:left-16 bg-yellow-400 px-4 py-2 rounded-lg neo-border neo-shadow-sm font-mono-type text-xs font-bold tracking-wider animate-float"
            >
              ON AIR
            </div>
            <div
              className="absolute -top-2 left-32 sm:left-48 bg-blue-400 text-white px-4 py-2 rounded-lg neo-border neo-shadow-sm font-mono-type text-xs font-bold tracking-wider animate-float"
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

            {/* Photo Card */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="bg-white p-3 rounded-2xl neo-border neo-shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="w-full max-w-xs aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src="/bg-desk.jpg"
                      alt="生活记录"
                      className="w-full h-full object-cover"
                    />
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
