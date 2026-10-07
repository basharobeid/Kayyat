import type { QuickItem, ServiceType } from '@/lib/api';

// Every service photo on the site comes from here, so swapping in new photography is a
// one-line change per scene.
export const SCENES = {
  hero: '/G4cfAEDulUqxGAMCOM4atCL63M.jpeg',
  shop_visit: '/fabric-store-collective.jpg',
  van_pickup: '/KHAYAT.png',
  home_service: '/mobile-tailor-van.svg',
  quick_fix: '/4ELzdJRzQ5VXQAPbmICpr3joms.png',
  measuring: '/fabric-store-atelier.jpg',
  workshop: '/AGI6JHG4ojGjbREnbz8H9K897g.png',
} as const;

export interface ServiceInfo {
  type: ServiceType;
  icon: string;
  image: string;
  ar: { name: string; short: string; long: string; steps: string };
  en: { name: string; short: string; long: string; steps: string };
}

export const SERVICES: ServiceInfo[] = [
  {
    type: 'van_pickup',
    icon: '🚐',
    image: SCENES.van_pickup,
    ar: {
      name: 'استلام بالفان مع القياس',
      short: 'الفان بيجي لعندك، بياخد القياس والقطعة، وبيرجعها جاهزة.',
      long: 'فان خيّاط بيوصل لبيتك بالموعد، بياخد قياسك وملاحظاتك، بينقل القطعة للمشغل، وبيرجعلك ياها جاهزة. وبتتابع كل خطوة لحظة بلحظة.',
      steps: 'قياس بالبيت · شغل بالمشغل · توصيل',
    },
    en: {
      name: 'Van pickup & measuring',
      short: 'Our van comes to you, takes your measurements and the piece, then returns it ready.',
      long: 'A Khayyat van arrives at your door on time, takes your measurements and notes, carries the piece to the workshop and brings it back finished. You follow every step live.',
      steps: 'Measured at home · Made in the workshop · Delivered',
    },
  },
  {
    type: 'home_service',
    icon: '🏠',
    image: SCENES.home_service,
    ar: {
      name: 'خيّاط لعندك',
      short: 'الخيّاط بيشتغل القطعة عندك بالبيت، إذا الشغلة بتسمح.',
      long: 'للشغلات يلي بتخلص بالمكان، متل التقصير وتعديل الأكمام: الخيّاط بيوصل بالفان المجهّز وبيخلّص الشغل عندك، بدون ما تطلع من البيت.',
      steps: 'زيارة · شغل بالمكان · جاهز بنفس الزيارة',
    },
    en: {
      name: 'Tailor at your home',
      short: 'The tailor does the work at your place, when the job allows it.',
      long: 'For jobs that can be finished on site, like hemming or sleeve adjustments, the tailor arrives in the equipped van and completes the work at your home.',
      steps: 'Visit · Work on site · Ready the same visit',
    },
  },
  {
    type: 'shop_visit',
    icon: '🪡',
    image: SCENES.shop_visit,
    ar: {
      name: 'موعد بالمحل',
      short: 'احجز وقتك، احكي مع الخيّاط قبلها، وتعال للقياس.',
      long: 'احجز موعد بدون انتظار. قبل ما تجي فيك تحكي معنا وتشرح شو بدك وتبعت صور، مشان الخيّاط يكون جاهز. الأنسب للتفصيل والقطع يلي بدها أكتر من بروفة.',
      steps: 'محادثة قبل الزيارة · قياس وبروفة · استلام',
    },
    en: {
      name: 'Shop appointment',
      short: 'Book a time, chat with the tailor beforehand, come in for your fitting.',
      long: 'Book a slot with no waiting. Before you come, chat with us, explain what you need and share photos so the tailor is ready. Best for custom tailoring and pieces that need several fittings.',
      steps: 'Chat before the visit · Fitting · Pick up',
    },
  },
  {
    type: 'quick_fix',
    icon: '🧵',
    image: SCENES.quick_fix,
    ar: {
      name: 'تصليح سريع',
      short: 'زر، سحاب، شق صغير؟ بسعر ثابت وبحجز أسرع.',
      long: 'للتصليحات البسيطة يلي ما بدها قياس: أزرار، خياطة بسيطة، شقوق صغيرة، سحابات. بتختار شو بدك، بتشوف السعر فوراً، وبنستلم وبنرجّع.',
      steps: 'اختار التصليح · سعر ثابت · استلام وتسليم',
    },
    en: {
      name: 'Quick fix',
      short: 'A button, a zipper, a small tear? Fixed price, faster booking.',
      long: 'For simple repairs that need no measuring: buttons, minor stitching, small tears, zippers. Pick the repair, see the price straight away, and we collect and return it.',
      steps: 'Pick the repair · Fixed price · Pickup & return',
    },
  },
];

export const serviceInfo = (type: ServiceType) => SERVICES.find((s) => s.type === type)!;

export const QUICK_ITEMS: { key: QuickItem; icon: string; ar: string; en: string }[] = [
  { key: 'button', icon: '🔘', ar: 'تركيب زر', en: 'Button replacement' },
  { key: 'stitching', icon: '🪡', ar: 'خياطة بسيطة', en: 'Minor stitching' },
  { key: 'tear', icon: '🩹', ar: 'شق صغير', en: 'Small tear' },
  { key: 'zipper', icon: '🤐', ar: 'سحاب', en: 'Zipper' },
  { key: 'adjustment', icon: '📏', ar: 'تعديل بسيط', en: 'Simple adjustment' },
  { key: 'other', icon: '➕', ar: 'تصليح صغير آخر', en: 'Other small repair' },
];

export const GARMENTS: { key: string; ar: string; en: string }[] = [
  { key: 'trousers', ar: 'بنطلون', en: 'Trousers' },
  { key: 'shirt', ar: 'قميص', en: 'Shirt' },
  { key: 'dress', ar: 'فستان', en: 'Dress' },
  { key: 'abaya', ar: 'عباية', en: 'Abaya' },
  { key: 'jacket', ar: 'جاكيت / بدلة', en: 'Jacket / suit' },
  { key: 'other', ar: 'غير ذلك', en: 'Other' },
];

// Labels for every pipeline step. Some steps read differently per service.
const STATUS: Record<string, { ar: string; en: string }> = {
  submitted: { ar: 'تم إرسال الطلب', en: 'Request submitted' },
  confirmed: { ar: 'تم التأكيد', en: 'Confirmed' },
  van_assigned: { ar: 'تم تعيين الفان', en: 'Van assigned' },
  pickup_in_progress: { ar: 'الفان بالطريق للاستلام', en: 'Pickup in progress' },
  item_received: { ar: 'استلمنا القطعة', en: 'Item received' },
  in_progress: { ar: 'قيد الشغل', en: 'Tailoring in progress' },
  quality_check: { ar: 'فحص الجودة', en: 'Quality check' },
  ready: { ar: 'جاهزة', en: 'Ready' },
  completed: { ar: 'تم التسليم', en: 'Delivered' },
  tailor_assigned: { ar: 'تم تعيين الخيّاط', en: 'Tailor assigned' },
  on_the_way: { ar: 'الخيّاط بالطريق', en: 'On the way' },
  at_location: { ar: 'الخيّاط وصل', en: 'At your location' },
  visited: { ar: 'تمت الزيارة والقياس', en: 'Visit & fitting done' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
};

const OVERRIDES: Partial<Record<ServiceType, Record<string, { ar: string; en: string }>>> = {
  home_service: {
    in_progress: { ar: 'الخيّاط عم يشتغل', en: 'Service in progress' },
    completed: { ar: 'تمت الخدمة', en: 'Completed' },
  },
  shop_visit: {
    ready: { ar: 'جاهزة للاستلام من المحل', en: 'Ready for pickup at the shop' },
    completed: { ar: 'تم الاستلام', en: 'Collected' },
  },
};

export function statusLabel(status: string, type: ServiceType, isAr: boolean): string {
  const label = OVERRIDES[type]?.[status] ?? STATUS[status] ?? { ar: status, en: status };
  return isAr ? label.ar : label.en;
}
