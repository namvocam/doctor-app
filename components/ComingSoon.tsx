import { BarChart3 } from 'lucide-react'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <BarChart3 className="h-8 w-8" />
      </span>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Tính năng đang được phát triển và sẽ sớm ra mắt.
      </p>
    </div>
  )
}
