import { useEffect, useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "elastic.out(1, 0.5)" } });

    tl.fromTo(
      titleRef.current,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2 }
    )
      .fromTo(
        subtitleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        btnRef.current,
        { y: 30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(
        imageRef.current,
        { x: 100, opacity: 0, rotation: 8 },
        { x: 0, opacity: 1, rotation: 0, duration: 1, ease: "power3.out" },
        "-=1"
      );

    return () => { tl.kill(); };
  }, []);

  // Mouse parallax for image
  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      gsap.to(image, {
        x: x * -20,
        y: y * -15,
        rotation: x * 2,
        duration: 0.6,
        ease: "power2.out",
      });
    };

    section.addEventListener("mousemove", onMouseMove);
    return () => section.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F9FAFB] pt-16"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-10 animate-float" />
      <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-yellow-400 rounded-lg opacity-20 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-pink-400 rounded-full opacity-15 animate-float" style={{ animationDelay: "0.5s" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Text Content - 60% */}
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-mono-type tracking-wide">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              欢迎来到我的小世界
            </div>

            <h1
              ref={titleRef}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
              style={{ transform: "rotate(-1deg)" }}
            >
              <span className="font-handwrite text-6xl sm:text-7xl lg:text-8xl text-blue-500">
                Hey!
              </span>
              <br />
              <span className="text-gray-900">你好呀</span>
              <span className="inline-block ml-2 animate-bounce">👋</span>
            </h1>

            <p
              ref={subtitleRef}
              className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed"
            >
              我是小桃，我在这里记录那些被风吹过的日常。无论是路边的一朵野花，还是深夜的一段旋律，都值得被记录下来。
            </p>

            <Link
              ref={btnRef}
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl neo-border neo-shadow hover:translate-x-1 hover:-translate-y-1 transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              开始逛逛
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Image - 40% */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div ref={imageRef} className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 relative">
                <img
                  src="/avatar-girl.png"
                  alt="博主头像"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              {/* Decorative shapes */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-2xl opacity-80 neo-border"
                style={{ transform: "rotate(12deg)" }}
              />
              <div
                className="absolute -bottom-4 -left-8 w-16 h-16 bg-yellow-400 rounded-full opacity-90 neo-border"
                style={{ transform: "rotate(-8deg)" }}
              />
              <div
                className="absolute top-1/2 -right-10 w-10 h-10 bg-pink-400 rounded-lg opacity-70 neo-border"
                style={{ transform: "rotate(20deg)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
