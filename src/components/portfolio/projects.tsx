'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import {
  Building2,
  Newspaper,
  Plane,
  Layers,
  Sparkles,
  Globe,
  ExternalLink,
  X,
  ArrowRight,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const filters = ['All', 'Hotel', 'News', 'Travel', 'Others'];

const visitButtonGradient = 'linear-gradient(135deg, #0ea5e9, #10b981)';
const visitButtonGradientColor = '#0ea5e9';

const categoryTextColor = '#1e1b4b';

const filterIcons: Record<string, React.ElementType> = {
  All: Sparkles,
  Hotel: Building2,
  News: Newspaper,
  Others: Layers,
  Travel: Plane,
};

const FONT_FAMILY =
  'Inter, var(--font-poppins), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const projects = [
  {
    id: 1,
    title: 'Dhading Post',
    category: 'News',
    icon: Newspaper,
    image: '/project/dhading.jpg',
    url: 'https://dhadingpost.com/',
  },
  {
    id: 2,
    title: 'Kiwani ASPAC',
    category: 'Others',
    icon: Layers,
    image: '/project/kiwani.jpg',
    url: 'https://wildstonesolution.com/kiwani-aspac/',
  },
  {
    id: 3,
    title: 'Blue Chip Security Limited',
    category: 'Others',
    icon: Layers,
    image: '/project/bluechip.jpg',
    url: 'https://wildstonesolution.com/blue-chip-security-limited/',
  },
  {
    id: 4,
    title: 'A.B. Herbal Industries',
    category: 'Others',
    icon: Layers,
    image: '/project/herbal.jpg',
    url: 'https://wildstonesolution.com/a-b-herbal-industries/',
  },
  {
    id: 5,
    title: 'Himalayan Yantra Handicrafts',
    category: 'Others',
    icon: Layers,
    image: '/project/himalayan.jpg',
    url: 'https://wildstonesolution.com/himalayan-yantra-handicrafts/',
  },
  {
    id: 6,
    title: 'Dolpo Yarsa',
    category: 'Others',
    icon: Layers,
    image: '/project/dolpa.jpg',
    url: 'https://wildstonesolution.com/dolpo-yarsa/',
  },
  {
    id: 7,
    title: 'Manaslu Adventure Treks',
    category: 'Travel',
    icon: Plane,
    image: '/project/manaslu.jpg',
    url: 'https://wildstonesolution.com/manaslu-adventure-treks/',
  },
  {
    id: 8,
    title: 'Shreeban Nature Camp',
    category: 'Hotel',
    icon: Building2,
    image: '/project/nature.jpg',
    url: 'https://wildstonesolution.com/shreeban-nature-camp/',
  },
];

const INITIAL_VISIBLE = 3;

export function Projects() {
  return <Portfolio />;
}

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAllOpen, setIsAllOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const filteredProjects =
    activeFilter === 'All'
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  const visibleProjects = filteredProjects.slice(0, INITIAL_VISIBLE);
  const hasMore = filteredProjects.length > INITIAL_VISIBLE;

  useEffect(() => {
    if (!headingRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (isAllOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isAllOpen]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const visitProject = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setMousePos({ x, y });
  };

  const renderFilterButtons = () => (
    <div
      className="scrollbar-hide flex w-full max-w-full justify-start gap-2 overflow-x-auto px-1 pb-2 sm:justify-center sm:gap-3"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        touchAction: 'pan-x',
      }}
    >
      <style>{`
        .wildstone-filter-btn,
        .wildstone-filter-btn * {
          cursor: pointer !important;
        }
      `}</style>
      {filters.map((filter) => {
        const FilterIcon = filterIcons[filter];
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterClick(filter)}
            className={`wildstone-filter-btn flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-bold whitespace-nowrap select-none transition-all duration-300 ease-out sm:gap-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 md:text-[17px]
              ${
                isActive
                  ? 'bg-transparent border-[#3b82f6] text-[#3b82f6] shadow-[0_0_16px_rgba(59,130,246,0.25),0_0_4px_rgba(59,130,246,0.15)]'
                  : 'bg-transparent border-transparent text-[#4b5563] hover:bg-[#eff6ff] hover:text-[#3b82f6] hover:border-transparent'
              }
            `}
            style={{
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            <FilterIcon
              className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors duration-300"
              style={{ color: isActive ? '#3b82f6' : '#4b5563' }}
            />
            <span>{filter}</span>
          </button>
        );
      })}
    </div>
  );

  const renderCard = (project: (typeof projects)[0], index: number) => {
    const IconComponent = project.icon;

    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 80, scale: 0.7, filter: 'blur(12px)' }}
        whileInView={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
        }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{
          duration: 0.6,
          delay: (index % INITIAL_VISIBLE) * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="wildstone-project-card group"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHoveredCard(project.id)}
        onMouseLeave={() => {
          setHoveredCard(null);
          setMousePos({ x: 0, y: 0 });
        }}
        onMouseMove={handleCardMouseMove}
        onClick={() => visitProject(project.url)}
      >
        <motion.div
          animate={{
            rotateX: hoveredCard === project.id ? mousePos.y : 0,
            rotateY: hoveredCard === project.id ? mousePos.x : 0,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative rounded-2xl overflow-hidden bg-white border border-[#e5e7eb] shadow-sm hover:shadow-2xl transition-shadow duration-500"
        >
          {/* Project Image — height now scales with breakpoint instead of a fixed h-64,
              so mobile single-column cards don't get a disproportionately tall crop
              compared to the desktop 3-column grid */}
          <div className="relative h-48 overflow-hidden min-[375px]:h-52 sm:h-56 md:h-60 xl:h-64">
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2.25rem), (max-width: 1439px) calc(33vw - 2rem), 405px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/80 via-[#1e1b4b]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

            {/* Hover: Visit Site button */}
            <motion.div
              initial={false}
              animate={{
                opacity: hoveredCard === project.id ? 1 : 0,
                scale: hoveredCard === project.id ? 1 : 0.8,
              }}
              transition={{
                duration: 0.3,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-bold shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110"
                style={{
                  background: visitButtonGradient,
                  boxShadow: `0 8px 32px ${visitButtonGradientColor}50`,
                  cursor: 'pointer',
                }}
              >
                <Globe className="w-5 h-5" />
                Visit Site
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Title at bottom of image on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
              <h3
                className="text-white font-bold text-lg drop-shadow-lg"
                style={{ fontFamily: FONT_FAMILY }}
              >
                {project.title}
              </h3>
            </div>
          </div>

          {/* Card Content */}
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-white border border-[#e5e7eb] shadow-sm"
            >
              <IconComponent
                className="w-5 h-5"
                style={{ color: '#6b7280' }}
              />
            </div>
            <div className="min-w-0">
              <h3
                className="text-base font-bold transition-colors duration-300 truncate"
                style={{
                  fontFamily: FONT_FAMILY,
                  color: hoveredCard === project.id ? '#10b981' : '#1e1b4b',
                }}
              >
                {project.title}
              </h3>
              <span
                className="text-xs font-bold uppercase cursor-pointer"
                style={{
                  color: categoryTextColor,
                  fontFamily: FONT_FAMILY,
                  letterSpacing: '0.08em',
                }}
              >
                {project.category}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <section
      id="projects"
      // Fixed: "md:py-15" was an invalid Tailwind class (15 isn't in the default
      // spacing scale — it silently generated no CSS), so desktop/tablet never
      // got the extra vertical breathing room it was meant to. Replaced with a
      // valid, progressively larger value.
      className="relative scroll-mt-24 overflow-hidden bg-[#f8f9fc] py-14 md:py-16"
      ref={sectionRef}
    >
      {/* Background decoration */}
      <style>{`
        .wildstone-project-card,
        .wildstone-project-card * {
          cursor: pointer !important;
        }
      `}</style>
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#8b5cf6]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#06b6d4]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headingRef} className="mb-8 text-center sm:mb-10 md:mb-14 lg:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-black sm:text-4xl lg:text-5xl"
            style={{ fontFamily: FONT_FAMILY }}
          >
            Selected Works
          </motion.h2>
        </div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 flex min-w-0 justify-start sm:mb-10 sm:justify-center lg:mb-12"
        >
          {renderFilterButtons()}
        </motion.div>

        {/* Projects Grid (limited) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
          >
            {visibleProjects.map((project, index) =>
              renderCard(project, index)
            )}
          </motion.div>
        </AnimatePresence>

        {/* View More — wrapper margin stays constant whether or not the
            button renders, so switching filters never shifts the section's
            bottom spacing */}
        <div className="mt-12 flex justify-center">
          {hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                type="button"
                onClick={() => setIsAllOpen(true)}
                className="wildstone-view-more flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-semibold border border-[#e5e7eb] bg-white text-[#1e1b4b] shadow-sm hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#eff6ff] hover:shadow-[0_0_16px_rgba(59,130,246,0.25),0_0_4px_rgba(59,130,246,0.15)] transition-all duration-300 ease-out hover:scale-105"
                style={{
                  fontFamily: FONT_FAMILY,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                <style>{`
                  .wildstone-view-more,
                  .wildstone-view-more * {
                    cursor: pointer !important;
                  }
                `}</style>
                View More
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Full-screen "all projects" overlay */}
      <AnimatePresence>
        {isAllOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-[#f8f9fc] overflow-y-auto"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#e5e7eb]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                  <h3
                    className="text-xl md:text-2xl font-bold text-[#1e1b4b]"
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    All Projects
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAllOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f3f4f6] hover:bg-[#1e1b4b] hover:text-white text-[#1e1b4b] transition-colors duration-300"
                    style={{ cursor: 'pointer' }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                {/* Filters inside overlay */}
                <div className="mb-8 flex min-w-0 justify-start sm:mb-10 sm:justify-center lg:mb-12">
                  {renderFilterButtons()}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`all-${activeFilter}`}
                    className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.3 },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  >
                    {filteredProjects.map((project, index) =>
                      renderCard(project, index)
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
