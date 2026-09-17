import { useCurrentUserProfile } from '@lark-apaas/client-toolkit';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header() {
  const profile = useCurrentUserProfile();

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(251_251_253_0.92)] backdrop-blur-md border-b border-black/5">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="-ml-1 h-11 w-11 md:hidden" />

        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium text-foreground leading-tight">
              {profile?.name ?? 'User'}
            </span>
            {profile?.email && (
              <span className="text-xs text-muted-foreground leading-tight">
                {profile.email}
              </span>
            )}
          </div>
          <Avatar className="size-8">
            {profile?.avatar && (
              <AvatarImage src={profile.avatar} alt={profile?.name ?? ''} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {(profile?.name ?? 'U').slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
