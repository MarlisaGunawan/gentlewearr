// One place to import GSAP from, so the ScrollTrigger plugin is always registered.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

// Animations only run for people who haven't asked for reduced motion.
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
