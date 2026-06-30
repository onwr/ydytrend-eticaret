"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaChevronDown, FaQuestionCircle } from "react-icons/fa"

interface FaqItem {
  id: number
  question: string
  answer: string
}

export function HomeFaqSection({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <section className="my-4 max-w-4xl mx-auto py-2">
      <div className="mb-8 text-center md:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-navy text-white rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
           <FaQuestionCircle aria-hidden /> Yardım Merkezi
        </div>
        <h2 className="text-2xl font-bold text-brand-text md:text-3xl">Sıkça Sorulan Sorular</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`rounded-2xl border transition-all duration-200 overflow-hidden
              ${openId === item.id ? 'bg-white border-brand-teal/30 shadow-[0_4px_20px_rgba(8,42,85,0.08)]' : 'bg-white border-brand-border hover:border-brand-teal/20'}`}
          >
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="w-full flex items-center justify-between p-5 md:p-6 text-left outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <span className={`text-[14px] font-semibold transition-colors ${openId === item.id ? 'text-brand-text' : 'text-brand-muted'}`}>
                {item.question}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${openId === item.id ? 'bg-zinc-900 text-white rotate-180' : 'bg-zinc-50 text-zinc-300'}`}>
                <FaChevronDown className="text-xs" />
              </div>
            </button>
            
            <AnimatePresence>
              {openId === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="px-8 pb-8">
                    <div className="h-px w-12 bg-zinc-100 mb-6" />
                    <p className="text-[14px] text-zinc-500 font-medium leading-7">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  )
}
