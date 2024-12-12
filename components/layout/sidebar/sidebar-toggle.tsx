"use client";

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/providers/sidebar-provider';

export function SidebarToggle() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
    </div>
  );
}