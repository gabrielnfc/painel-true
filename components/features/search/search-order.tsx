"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchResults } from './search-results';
import { useOrderSearch } from './use-order-search';
import { toast } from '@/components/ui/use-toast';

export function SearchOrder() {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading, error, search } = useOrderSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter an order ID, number, or purchase order number",
        variant: "destructive",
      });
      return;
    }

    await search(searchQuery.trim());
  };

  return (
    <div className="space-y-6">
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
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </form>
      </Card>
      <SearchResults 
        results={results}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}