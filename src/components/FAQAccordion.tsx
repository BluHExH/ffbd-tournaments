"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: { en: "Is entry really free for some tournaments?", bn: "কিছু টুর্নামেন্টে কি সত্যিই ফ্রি এন্ট্রি?" },
    a: {
      en: "Yes. Cups marked FREE need no payment. Paid cups require bKash or Nagad before the room ID is sent.",
      bn: "হ্যাঁ। FREE মার্ক করা কাপে কোনো পেমেন্ট লাগে না। পেইড কাপে রুম আইডি পাঠানোর আগে বিকাশ বা নগদ পেমেন্ট লাগবে।",
    },
  },
  {
    q: { en: "When do I get Room ID and password?", bn: "রুম আইডি ও পাসওয়ার্ড কখন পাব?" },
    a: {
      en: "Room details unlock about 10 minutes before match start. You will also get a WhatsApp / in-app notification.",
      bn: "ম্যাচ শুরুর প্রায় ১০ মিনিট আগে রুম ডিটেইলস আনলক হয়। WhatsApp বা অ্যাপ নোটিফিকেশনও পাবেন।",
    },
  },
  {
    q: { en: "How are prizes paid?", bn: "প্রাইজ কিভাবে দেওয়া হয়?" },
    a: {
      en: "Winners are paid on bKash or Nagad after result verification, usually within a few hours of match end.",
      bn: "রেজাল্ট ভেরিফিকেশনের পর বিজয়ীদের বিকাশ বা নগদে পেমেন্ট করা হয়, সাধারণত ম্যাচ শেষের কয়েক ঘণ্টার মধ্যে।",
    },
  },
  {
    q: { en: "Can I use emulator or hacks?", bn: "এমুলেটর বা হ্যাক ব্যবহার করা যাবে?" },
    a: {
      en: "No. Emulator, hacks, teaming and account sharing are banned. Offenders are disqualified without refund.",
      bn: "না। এমুলেটর, হ্যাক, টিমিং ও অ্যাকাউন্ট শেয়ার নিষিদ্ধ। ধরা পড়লে রিফান্ড ছাড়াই ডিসকোয়ালিফাই।",
    },
  },
  {
    q: { en: "What maps are played?", bn: "কোন ম্যাপে খেলা হয়?" },
    a: {
      en: "Bermuda, Purgatory, Kalahari and Alpine depending on the tournament. Check each cup's detail page.",
      bn: "টুর্নামেন্ট অনুযায়ী Bermuda, Purgatory, Kalahari ও Alpine। প্রতিটি কাপের ডিটেইল পেজ দেখুন।",
    },
  },
  {
    q: { en: "How do I contact support?", bn: "সাপোর্টে কিভাবে যোগাযোগ করব?" },
    a: {
      en: "WhatsApp support and email (support@ffbd.gg) are in the footer. Reply time is usually under 30 minutes during live events.",
      bn: "ফুটারে WhatsApp সাপোর্ট ও ইমেইল (support@ffbd.gg) আছে। লাইভ ইভেন্টে সাধারণত ৩০ মিনিটের মধ্যে রিপ্লাই।",
    },
  },
];

export default function FAQAccordion({ lang }: { lang: "en" | "bn" }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="card-light overflow-hidden border border-slate-100"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-heading font-bold text-[#0F172A] text-sm sm:text-base">
                {item.q[lang]}
              </span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180 text-[#FF5C00]"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-slate-500 leading-relaxed">
                  {item.a[lang]}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
