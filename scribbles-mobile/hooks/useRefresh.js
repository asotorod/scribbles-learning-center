import { useState, useCallback } from 'react';

export const useRefresh = (fetchFn) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFn();
    } catch (e) {
      // Silently handle — screen should show its own error state
    } finally {
      setRefreshing(false);
    }
  }, [fetchFn]);

  return { refreshing, onRefresh };
};
