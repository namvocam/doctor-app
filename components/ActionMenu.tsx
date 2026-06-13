'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, type LucideIcon } from 'lucide-react'

export interface ActionItem {
  label: string
  icon: LucideIcon
  onClick: () => void
  danger?: boolean
}

const MENU_WIDTH = 180

/** Nút 3 chấm mở menu hành động (popup portal ra body để không bị bảng cắt). */
export default function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onScrollOrResize() {
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)
      const estHeight = items.length * 40 + 12
      const top =
        rect.bottom + estHeight > window.innerHeight ? rect.top - estHeight : rect.bottom + 4
      setPos({ top, left: Math.max(8, left) })
    }
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="rounded p-1 text-gray-500 transition hover:bg-black/5"
        aria-label="Thao tác"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="fixed z-[80] rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-gray-50 ${
                  item.danger ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
