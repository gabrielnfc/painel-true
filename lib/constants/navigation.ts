import { Search, BarChart2 } from 'lucide-react';

export const navigation = [
  { name: 'Search Order', href: '/ecommerce/orders/search', icon: Search },
  { name: 'General Order Report', href: '/ecommerce/report', icon: BarChart2 },
] as const;