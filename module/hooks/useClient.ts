import { useEffect, useState } from 'react';
import rootStore from '../store';
const useClient = () => {
  let [client, setClient] = useState<any>(rootStore.client);

  useEffect(() => {
    setClient(rootStore.client);
  }, [rootStore.client]);
  return client;
};

export { useClient };
