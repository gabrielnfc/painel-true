"use client";

import { useSidebar } from '@/components/providers/sidebar-provider';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';
import { SidebarToggle } from './sidebar-toggle';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { isOpen } = useSidebar();

  return (
    <>
      <SidebarToggle />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <SidebarHeader />
          <SidebarNav />
        </div>
      </div>
    </>
  );
}