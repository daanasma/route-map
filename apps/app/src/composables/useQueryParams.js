// useQueryParam.js
import {useRouter} from 'vue-router';
import {log} from '../debug/debug.js';

export function useUpdateQueryParam() {
    const router = useRouter();

    const updateQueryParam = (key, value) => {
      const currentQuery = { ...router.currentRoute.value.query };
      let hasChanges = false;

      if (value === null || value === undefined) {
        // Remove the param if it exists
        if (key in currentQuery) {
          delete currentQuery[key];
          hasChanges = true;
        }
      } else {
        // Add/update the param
        if (currentQuery[key] !== value) {
          currentQuery[key] = value;
          hasChanges = true;
          console.log('ready to push!', currentQuery)
        }
      }

      if (!hasChanges) {
        log('QueryComp: No change needed for', key);
        return;
      }

      router.push({ query: currentQuery }).catch(err => {
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

        router.push({query: {}}).catch((err) => {
            if (err.name !== 'NavigationDuplicated') {
                console.error('QueryComp: Error clearing query parameters:', err);
            }
        });
    };

    // Optional: Batch update multiple params at once
    const updateQueryParams = (params) => {
        const currentQuery = router.currentRoute.value.query;
        const newQuery = {...currentQuery};

        let hasChanges = false;

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                if (key in newQuery) {
                    delete newQuery[key];
                    hasChanges = true;
                }
            } else if (currentQuery[key] !== value) {
                newQuery[key] = value;
                hasChanges = true;
            }
        });

        if (!hasChanges) return;

        router.push({query: newQuery}).catch(err => {
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
