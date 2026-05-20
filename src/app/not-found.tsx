import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <MapPin className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/today">Go home</Link>
      </Button>
    </div>
  );
}
