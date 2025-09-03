import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Profile } from '../utils/appTypes';

export const useProfile = (selectedKey: string) => {
  const { requestProfile } = useContext(AppContext);
  const [profile, setProfile] = useState<Profile>();

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        cleanup =
          requestProfile(selectedKey, (data) => setProfile(data)) ?? cleanup;
      }
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestProfile]);

  return profile?.public_key === selectedKey ? profile : null;
};
