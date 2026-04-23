import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StickyNote, Heart, CheckSquare } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function TypewriterCard() {
  const textRef = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState("");
  const fullText = "正在连接夏日记忆数据库... 读取中... 发现一段关于海风的声音。";

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: textRef.current,
      start: "top 80%",
      onEnter: () => {
        let i = 0;
        const interval = setInterval(() => {
          if (i <= fullText.length) {
            setDisplayText(fullText.slice(0, i));
            i++;
          } else {
            clearInterval(interval);
          }
        }, 80);
        return () => clearInterval(interval);
      },
      once: true,
    });

    return () => trigger.kill();
  }, []);

  return (
    <div className="bg-gray-900 text-green-400 p-5 rounded-2xl neo-border neo-shadow-sm font-mono-type text-sm leading-relaxed">
      <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        SYSTEM.LOG
      </div>
      <span ref={textRef}>
        {"> "}{displayText}
        <span className="typing-cursor inline-block w-2 h-4 bg-green-400 ml-0.5 align-middle" />
      </span>
    </div>
  );
}

const noteCards = [
  {
    id: 1,
    bg: "bg-yellow-200",
    icon: <CheckSquare className="w-5 h-5" />,
    title: "今日待办",
    content: "给窗台的绿萝浇水\n读完《月亮与六便士》第三章\n写一段随想笔记",
    rotation: "-2deg",
  },
  {
    id: 2,
    bg: "bg-pink-200",
    icon: <Heart className="w-5 h-5" />,
    title: "心情指数",
    content: "心情指数：🌟🌟🌟🌟☆\n\n\"今天收到了一封\n来自远方朋友的信。\"",
    rotation: "1.5deg",
  },
  {
    id: 3,
    bg: "bg-blue-200",
    icon: <StickyNote className="w-5 h-5" />,
    title: "灵感碎片",
    content: "\"最好的相机\n是你随身携带的那台\"\n\n— Chase Jarvis",
    rotation: "-1deg",
  },
];

export default function Notes() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll(".note-card");
      if (!cards) return;

      gsap.fromTo(
        cards,
        { y: 100, opacity: 0, rotation: -10 },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-mono-type tracking-wider mb-4">
            STICKY NOTES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            便签记事
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            零碎的思考、待办事项和一闪而过的灵感
          </p>
        </div>

        {/* Notes Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {noteCards.map((note) => (
            <div
              key={note.id}
              className={`note-card ${note.bg} p-5 rounded-2xl neo-border neo-shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg`}
              style={{ transform: `rotate(${note.rotation})` }}
            >
              <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold">
                {note.icon}
                {note.title}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {note.content}
              </p>
            </div>
          ))}

          {/* Typewriter Card */}
          <div
            className="note-card"
            style={{ transform: "rotate(0.5deg)" }}
          >
            <TypewriterCard />
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            to="/thoughts"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            查看更多随想
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
