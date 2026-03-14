import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist.{' '}
        <Link href="/" className="text-emerald-500 hover:underline">
          Go home
        </Link>
      </p>
    </div>
  )
}
