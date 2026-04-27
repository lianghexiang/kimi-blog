import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  Image as ImageIcon,
  MapPin,
  MoveVertical,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import Footer from "@/sections/Footer";

type GalleryImage = {
  id: number;
  title: string;
  description: string;
  url: string;
  album: string;
};

const TEXT = {
  untitledAlbum: "\u672a\u5206\u7c7b",
  galleryTitle: "\u753b\u5eca",
  galleryIntro:
    "\u8fd9\u91cc\u6536\u85cf\u4e86\u5149\u5f71\u3001\u8def\u9014\u548c\u4e00\u4e9b\u60f3\u7559\u4f4f\u7684\u7247\u523b\u3002\u70b9\u51fb\u4efb\u610f\u7167\u7247\u53ef\u4ee5\u653e\u5927\u67e5\u770b\uff0c\u6eda\u52a8\u5207\u6362\u4f1a\u5e26\u4e00\u70b9\u987a\u6ed1\u7684\u52a8\u6548\u3002",
  allAlbums: "\u5168\u90e8",
  zoomHint: "\u653e\u5927\u67e5\u770b",
  emptyAlbum: "\u8be5\u5206\u7c7b\u4e0b\u8fd8\u6ca1\u6709\u56fe\u7247",
  previewTitle: "\u56fe\u7247\u9884\u89c8",
  previewDesc:
    "\u53ef\u4f7f\u7528\u6eda\u8f6e\u3001\u5de6\u53f3\u6309\u94ae\u6216\u952e\u76d8\u65b9\u5411\u952e\u5207\u6362\u56fe\u7247\u3002",
  closePreview: "\u5173\u95ed\u9884\u89c8",
  prevImage: "\u4e0a\u4e00\u5f20",
  nextImage: "\u4e0b\u4e00\u5f20",
  noDescription: "\u8fd9\u4e00\u5f20\u6682\u65f6\u8fd8\u6ca1\u6709\u8865\u5145\u8bf4\u660e\u3002",
  wheelHint: "\u6eda\u52a8\u9f20\u6807\u5207\u6362\u7167\u7247",
  fallback1Title: "\u6625\u65e5\u6a31\u82b1",
  fallback1Desc:
    "2024 \u5e74\u6625\uff0c\u5bb6\u9644\u8fd1\u7684\u516c\u56ed\u6a31\u82b1\u76db\u5f00\u3002",
  fallback2Title: "\u84dd\u8272\u9759\u7269",
  fallback2Desc:
    "\u6781\u7b80\u4e3b\u4e49\u8272\u5f69\u7ec3\u4e60\uff0c\u6a59\u5b50\u4e0e\u514b\u83b1\u56e0\u84dd\u7684\u5bf9\u649e\u3002",
  fallback3Title: "\u65e5\u843d\u6d77\u8fb9",
  fallback3Desc:
    "\u91d1\u8272\u9ec4\u660f\u91cc\uff0c\u6d77\u6d6a\u4e0e\u98de\u9e1f\u4e00\u8d77\u843d\u8fdb\u508d\u665a\u3002",
  fallback4Title: "\u79cb\u65e5\u5c0f\u5f84",
  fallback4Desc:
    "\u94fa\u6ee1\u843d\u53f6\u7684\u6797\u95f4\u5c0f\u9053\uff0c\u5e26\u7740\u79cb\u5929\u72ec\u6709\u7684\u6e29\u67d4\u3002",
  fallback5Title: "\u719f\u7761\u7684\u5c0f\u732b",
  fallback5Desc:
    "\u753b\u4e86\u4e00\u53ea\u6253\u76f9\u7684\u5c0f\u732b\uff0c\u5e0c\u671b\u80fd\u5e26\u6765\u7247\u523b\u5b81\u9759\u3002",
  albumPhoto: "\u6444\u5f71",
  albumTravel: "\u65c5\u884c",
  albumIllustration: "\u63d2\u753b",
} as const;

const fallbackImages: GalleryImage[] = [
  {
    id: 1,
    title: TEXT.fallback1Title,
    description: TEXT.fallback1Desc,
    url: "/photo-spring.jpg",
    album: TEXT.albumPhoto,
  },
  {
    id: 2,
    title: TEXT.fallback2Title,
    description: TEXT.fallback2Desc,
    url: "/photo-orange.jpg",
    album: TEXT.albumPhoto,
  },
  {
    id: 3,
    title: TEXT.fallback3Title,
    description: TEXT.fallback3Desc,
    url: "/photo-sea.jpg",
    album: TEXT.albumTravel,
  },
  {
    id: 4,
    title: TEXT.fallback4Title,
    description: TEXT.fallback4Desc,
    url: "/photo-autumn.jpg",
    album: TEXT.albumTravel,
  },
  {
    id: 5,
    title: TEXT.fallback5Title,
    description: TEXT.fallback5Desc,
    url: "/photo-cat.png",
    album: TEXT.albumIllustration,
  },
];

export default function GalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);
  const [previewDirection, setPreviewDirection] = useState<1 | -1>(1);
  const [previewTick, setPreviewTick] = useState(0);
  const wheelLockRef = useRef(0);

  const { data: dbImages } = useQuery({
    queryKey: ["images", "list"],
    queryFn: () => api.images.list(),
  });

  const images = useMemo<GalleryImage[]>(
    () =>
      dbImages && dbImages.length > 0
        ? dbImages.map((img) => ({
            id: img.id,
            title: img.title,
            description: img.description || "",
            url: img.url,
            album: img.album || TEXT.untitledAlbum,
          }))
        : fallbackImages,
    [dbImages]
  );

  const albums = useMemo(
    () => Array.from(new Set(images.map((img) => img.album))),
    [images]
  );

  const filteredImages = useMemo(
    () =>
      selectedAlbum
        ? images.filter((img) => img.album === selectedAlbum)
        : images,
    [images, selectedAlbum]
  );

  const activeImageIndex = filteredImages.findIndex(
    (image) => image.id === activeImageId
  );
  const activeImage =
    activeImageIndex >= 0 ? filteredImages[activeImageIndex] : null;

  useEffect(() => {
    if (!previewOpen) {
      return;
    }

    if (filteredImages.length === 0) {
      setPreviewOpen(false);
      setActiveImageId(null);
      return;
    }

    if (!activeImage) {
      setActiveImageId(filteredImages[0].id);
    }
  }, [activeImage, filteredImages, previewOpen]);

  useEffect(() => {
    if (!previewOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigatePreview(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigatePreview(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen, activeImageIndex, filteredImages.length]);

  const openPreview = (imageId: number) => {
    setActiveImageId(imageId);
    setPreviewDirection(1);
    setPreviewTick((tick) => tick + 1);
    setPreviewOpen(true);
  };

  const navigatePreview = (direction: 1 | -1) => {
    if (filteredImages.length <= 1) {
      return;
    }

    const currentIndex = activeImageIndex >= 0 ? activeImageIndex : 0;
    const nextIndex =
      (currentIndex + direction + filteredImages.length) % filteredImages.length;

    setPreviewDirection(direction);
    setActiveImageId(filteredImages[nextIndex].id);
    setPreviewTick((tick) => tick + 1);
  };

  const handlePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (filteredImages.length <= 1 || Math.abs(event.deltaY) < 12) {
      return;
    }

    event.preventDefault();

    const now = Date.now();
    if (now - wheelLockRef.current < 420) {
      return;
    }

    wheelLockRef.current = now;
    navigatePreview(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="font-mono-type mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs tracking-wider text-yellow-800">
              <Camera className="h-3.5 w-3.5" />
              GALLERY
            </span>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              {TEXT.galleryTitle}
            </h1>
            <p className="mx-auto max-w-lg text-gray-600">{TEXT.galleryIntro}</p>
          </div>

          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedAlbum(null)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                !selectedAlbum
                  ? "neo-border bg-yellow-400 text-black"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              {TEXT.allAlbums}
            </button>
            {albums.map((album) => (
              <button
                key={album}
                onClick={() => setSelectedAlbum(album)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedAlbum === album
                    ? "neo-border bg-yellow-400 text-black"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MapPin className="h-4 w-4" />
                {album}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => openPreview(image.id)}
                className="group relative overflow-hidden rounded-2xl bg-white text-left transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-4"
              >
                <div className="neo-border neo-shadow-sm absolute inset-0 rounded-2xl" />
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-x-0 top-0 flex justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white">
                      <Expand className="h-3.5 w-3.5" />
                      {TEXT.zoomHint}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900">{image.title}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {image.album}
                      </span>
                    </div>
                    {image.description && (
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-gray-400">{TEXT.emptyAlbum}</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-[min(1120px,calc(100vw-2rem))]"
          onWheel={handlePreviewWheel}
        >
          <DialogTitle className="sr-only">
            {activeImage
              ? `${activeImage.title} ${TEXT.previewTitle}`
              : TEXT.previewTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {TEXT.previewDesc}
          </DialogDescription>

          {activeImage && (
            <div className="relative rounded-[28px] bg-white/96 p-3 backdrop-blur md:p-4">
              <DialogClose className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">{TEXT.closePreview}</span>
              </DialogClose>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] md:gap-5">
                <div className="relative flex min-h-[56vh] items-center justify-center overflow-hidden rounded-[22px] bg-stone-950 p-3 md:min-h-[72vh]">
                  {filteredImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigatePreview(-1)}
                        className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        aria-label={TEXT.prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigatePreview(1)}
                        className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        aria-label={TEXT.nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <div
                    key={`${activeImage.id}-${previewTick}`}
                    className={`gallery-preview-frame ${
                      previewDirection === 1
                        ? "gallery-preview-enter-next"
                        : "gallery-preview-enter-prev"
                    }`}
                  >
                    <img
                      src={activeImage.url}
                      alt={activeImage.title}
                      className="max-h-[70vh] w-auto max-w-full rounded-[18px] object-contain md:max-h-[76vh]"
                    />
                  </div>
                </div>

                <div className="neo-border flex min-h-full flex-col rounded-[22px] bg-[#FFF6D8] p-5 text-left">
                  <div
                    key={`meta-${activeImage.id}-${previewTick}`}
                    className={`gallery-preview-meta ${
                      previewDirection === 1
                        ? "gallery-preview-enter-next"
                        : "gallery-preview-enter-prev"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono-type text-xs uppercase tracking-[0.24em] text-gray-500">
                          Photo Preview
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900">
                          {activeImage.title}
                        </h2>
                      </div>
                      <span className="neo-border rounded-full bg-white px-3 py-1 text-sm text-gray-700">
                        {activeImage.album}
                      </span>
                    </div>

                    <p className="text-sm leading-7 text-gray-700">
                      {activeImage.description || TEXT.noDescription}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MoveVertical className="h-4 w-4" />
                      <span>{TEXT.wheelHint}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      {activeImageIndex + 1} / {filteredImages.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
