import { Search, BarChart2 } from 'lucide-react';

export const navigation = [
  { name: 'Search Order', href: '/', icon: Search },
  { name: 'General Order Report', href: '/report', icon: BarChart2 },
] as const;