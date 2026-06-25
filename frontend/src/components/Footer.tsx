import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background py-6 mt-auto">
      <div className="container text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          © 2025. Built with <Heart className="w-4 h-4 text-fun-pink fill-fun-pink" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fun-purple hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
