import { Mic2, MessageSquareText } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function Header() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fun-purple via-fun-pink to-fun-yellow flex items-center justify-center shadow-fun">
            <Mic2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fun-purple via-fun-pink to-fun-yellow bg-clip-text text-transparent">
            Voice Changer
          </h1>
        </Link>

        <nav className="flex gap-2">
          <Link to="/">
            <Button
              variant={currentPath === '/' ? 'default' : 'ghost'}
              className={
                currentPath === '/'
                  ? 'bg-gradient-to-r from-fun-purple to-fun-pink text-white'
                  : ''
              }
            >
              <Mic2 className="w-4 h-4 mr-2" />
              Voice Changer
            </Button>
          </Link>
          <Link to="/text-to-speech">
            <Button
              variant={currentPath === '/text-to-speech' ? 'default' : 'ghost'}
              className={
                currentPath === '/text-to-speech'
                  ? 'bg-gradient-to-r from-fun-blue to-fun-green text-white'
                  : ''
              }
            >
              <MessageSquareText className="w-4 h-4 mr-2" />
              Text-to-Speech
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
