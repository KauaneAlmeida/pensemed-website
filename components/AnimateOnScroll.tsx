'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-in';
  delay?: number; // delay in ms
  duration?: number; // duration in ms
  threshold?: number; // 0 to 1, when to trigger
  once?: boolean; // animate only once
  mobileSimplified?: boolean; // simpler animation on mobile
}

export default function AnimateOnScroll({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  mobileSimplified = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add small delay before triggering animation
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);

          if (once) {
            observer.unobserve(element);
          }
        } else if (!once && !hasAnimated) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is fully visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold, once, hasAnimated]);

  // Animation classes based on type
  const getAnimationClasses = () => {
    // Using cubic-bezier for smoother, more elegant easing
    const baseClasses = 'transition-all';

    // Initial state (before animation) - more subtle movement
    const initialState = {
      'fade-up': 'opacity-0 translate-y-5 sm:translate-y-8',
      'fade-in': 'opacity-0',
      'fade-left': 'opacity-0 -translate-x-5 sm:-translate-x-8',
      'fade-right': 'opacity-0 translate-x-5 sm:translate-x-8',
      'scale-in': 'opacity-0 scale-[0.97]',
    };

    // Final state (after animation)
    const finalState = 'opacity-100 translate-y-0 translate-x-0 scale-100';

    if (isVisible) {
      return `${baseClasses} ${finalState}`;
    }

    // On mobile, use simpler animations if enabled
    if (mobileSimplified) {
      return `${baseClasses} ${initialState[animation]} sm:${initialState[animation]}`;
    }

    return `${baseClasses} ${initialState[animation]}`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', // Smooth, elegant easing
        transitionDelay: isVisible ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Stagger container for animating multiple children with delays
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number; // delay between each child in ms
  animation?: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-in';
  duration?: number;
  threshold?: number;
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 100,
  animation = 'fade-up',
  duration = 600,
  threshold = 0.1,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  // Animation initial states
  const initialState = {
    'fade-up': 'opacity-0 translate-y-8',
    'fade-in': 'opacity-0',
    'fade-left': 'opacity-0 -translate-x-8',
    'fade-right': 'opacity-0 translate-x-8',
    'scale-in': 'opacity-0 scale-95',
  };

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={`transition-all ease-out ${
                isVisible
                  ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
                  : initialState[animation]
              }`}
              style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: isVisible ? `${index * staggerDelay}ms` : '0ms',
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
