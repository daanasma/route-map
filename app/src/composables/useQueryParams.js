// useQueryParam.js
import { useRouter } from 'vue-router';
import { log } from '../debug/debug.js';

export function useUpdateQueryParam() {
  const router = useRouter();

  const updateQueryParam = (key, value) => {
    const currentQuery = router.currentRoute.value.query;

    // Skip if value hasn't changed
    if (currentQuery[key] === value) {
      log('QueryComp: No change needed for', key);
      return;
    }

    router.push({
      query: { ...currentQuery, [key]: value }
    }).catch((err) => {
      // Navigation failures are often harmless (duplicate navigation)
      if (err.name !== 'NavigationDuplicated') {
        console.error('QueryComp: Error updating query parameter:', err);
      }
    });
  };

  const clearQueryParams = () => {
    // Only clear if there are params to clear
    if (Object.keys(router.currentRoute.value.query).length === 0) {
      log('QueryComp: No query params to clear');
      return;
    }

    router.push({ query: {} }).catch((err) => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('QueryComp: Error clearing query parameters:', err);
      }
    });
  };

  // Optional: Batch update multiple params at once
  const updateQueryParams = (params) => {
    const currentQuery = router.currentRoute.value.query;
    const newQuery = { ...currentQuery, ...params };

    // Check if anything actually changed
    const hasChanges = Object.keys(params).some(
      key => currentQuery[key] !== params[key]
    );

    if (!hasChanges) return;

    router.push({ query: newQuery }).catch((err) => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('QueryComp: Error updating query parameters:', err);
      }
    });
  };

  return {
    updateQueryParam,
    clearQueryParams,
    updateQueryParams,
  };
}
