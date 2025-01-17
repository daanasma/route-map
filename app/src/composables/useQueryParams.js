// useUpdateQueryParam.js (composable)
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useRouteInfoStore } from '../stores/routestatus.js'; // Import the store

export function useUpdateQueryParam() {
  const router = useRouter();
  const store = useRouteInfoStore(); // Access the store

  //  console.log('setting up useUpdateQueryParam')
  // Enable URL update when explicitly called

  const updateQueryParam = (key, value) => {
    console.log('trying to update url', store)
    if (!store.urlReadyToUpdate) {

      console.log('Router is not ready. Query parameter update skipped.');
      return;
    }

    const currentQuery = { ...router.currentRoute.value.query };
    currentQuery[key] = value;

    // Check if the query actually needs to be updated
    if (JSON.stringify(currentQuery) !== JSON.stringify(router.currentRoute.value.query)) {
      router.push({ query: currentQuery }).catch((err) => {
        console.error('Error updating query parameter:', err);
      });
    }
  };

  return {
    updateQueryParam
  };
}
