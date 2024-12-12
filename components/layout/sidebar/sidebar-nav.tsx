"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}