'use client';

import useSWR from 'swr';
import {createClient} from '@/lib/supabase/client';
import type {MenuItem} from '@/types/database';

export function useMenuItems(restaurantId: string) {
  const supabase = createClient();

  const {data, isLoading, error} = useSWR(
    ['menu-items', restaurantId],
    async () => {
      const {data, error} = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', {ascending: true});

      if (error) throw error;
      return data as MenuItem[];
    }
  );

  return {
    menuItems: data ?? [],
    isLoading,
    error,
  };
}
