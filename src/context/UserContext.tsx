import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface UserContextType {
  profile: UserProfile;
  initials: string;
  updateProfile: (updated: Partial<UserProfile>) => void;
  setProfileImage: (image: string | null) => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: '',
  companyName: '',
  email: '',
  companyRif: '',
  profileImage: null,
};

const UserContext = createContext<UserContextType>({
  profile: DEFAULT_PROFILE,
  initials: 'NX',
  updateProfile: () => {},
  setProfileImage: () => {},
  resetProfile: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem('nixi_user_profile');
      const savedImage = localStorage.getItem('nixi_profile_image');

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        const isMockData =
          parsed.fullName === 'Gabriel Echeverría' ||
          parsed.fullName === 'Eloy Gabriel Palma' ||
          parsed.email === 'Egabriel79@gmail.com' ||
          parsed.email === 'egabriel79@gmail.com' ||
          parsed.companyName === 'Nixi Soluciones Financieras C.A.' ||
          parsed.companyName === 'Nixi Soluciones' ||
          parsed.companyRif === 'J-50491823-1';

        if (isMockData) {
          localStorage.removeItem('nixi_user_profile');
          return DEFAULT_PROFILE;
        }
        if (savedImage !== null) {
          parsed.profileImage = savedImage;
        }
        return parsed;
      }
      if (savedImage) {
        return { ...DEFAULT_PROFILE, profileImage: savedImage };
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const initials = useMemoInitials(profile.fullName);

  // Persist profile and profileImage on change
  useEffect(() => {
    try {
      localStorage.setItem('nixi_user_profile', JSON.stringify(profile));
      if (profile.profileImage) {
        localStorage.setItem('nixi_profile_image', profile.profileImage);
      } else {
        localStorage.removeItem('nixi_profile_image');
      }
    } catch (e) {
      console.warn('Error guardando perfil en localStorage', e);
    }
  }, [profile]);

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const setProfileImage = (image: string | null) => {
    setProfile((prev) => ({ ...prev, profileImage: image }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem('nixi_user_profile');
      localStorage.removeItem('nixi_profile_image');
    } catch (e) {
      console.warn('Error reseteando perfil en localStorage', e);
    }
  };

  return (
    <UserContext.Provider value={{ profile, initials, updateProfile, setProfileImage, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
};

function useMemoInitials(name: string): string {
  if (!name.trim()) return 'GE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const useUser = () => useContext(UserContext);
