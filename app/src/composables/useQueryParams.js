// useQueryParam.js (composable)
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useRouteInfoStore } from '../stores/routestatus.js'; // Import the store

export function useUpdateQueryParam() {
  const router = useRouter();
  const store = useRouteInfoStore(); // Access the store

  // Enable URL update when explicitly called

  const updateQueryParam = (key, value) => {
    console.log('QueryComp: trying to update url', store)
    if (!store.urlReadyToUpdate) {

      console.log('QueryComp: Router is not ready. Query parameter update skipped.');
      return;
    }

    const currentQuery = { ...router.currentRoute.value.query };
    currentQuery[key] = value;

    // Check if the query actually needs to be updated
    if (JSON.stringify(currentQuery) !== JSON.stringify(router.currentRoute.value.query)) {
      router.push({ query: currentQuery }).catch((err) => {
        console.error('QueryComp: Error updating query parameter:', err);
      });
    }
  };
  const clearQueryParams = () => {
    console.log('QueryComp: Trying to clear all query params', store);
    if (!store.urlReadyToUpdate) {
      console.log('QueryComp: Router is not ready. Query parameter clearing skipped.');
      return;
    }

    router.push({ query: {} }).catch((err) => {
      console.error('QueryComp: Error clearing query parameters:', err);
      return
    });
    console.debug('QueryComp: finished clearQueryParams')
  };
  return {
    updateQueryParam,
    clearQueryParams
  };
}
