"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SearchOrder() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
  };

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="flex flex-col space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search Order
          </label>
          <div className="flex space-x-2">
            <Input
              id="search"
              type="text"
              placeholder="Enter order ID, number, or purchase order number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}