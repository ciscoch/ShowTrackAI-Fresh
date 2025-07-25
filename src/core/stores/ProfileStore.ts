import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, ProfileCreationData, DEFAULT_SETTINGS, DEFAULT_STATS, PROFILE_TYPES } from '../models/Profile';
import { useJournalStore } from './JournalStore';
import { useAnimalStore } from './AnimalStore';

interface ProfileState {
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  isFirstLaunch: boolean;
  
  // Actions
  createProfile: (data: ProfileCreationData) => Promise<UserProfile>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  getCurrentProfile: () => UserProfile | null;
  getAllProfiles: () => UserProfile[];
  updateProfileStats: (id: string, stats: Partial<UserProfile['stats']>) => Promise<void>;
  setFirstLaunchComplete: () => void;
  createDemoProfiles: () => Promise<void>;
  getDemoProfiles: () => UserProfile[];
  checkLimitations: (profileId: string, action: string, count?: number) => { allowed: boolean; message?: string };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfile: null,
      isFirstLaunch: true,

      createProfile: async (data: ProfileCreationData) => {
        const newProfile: UserProfile = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          type: data.type,
          avatar: data.avatar,
          school: data.school,
          grade: data.grade,
          chapter: data.chapter,
          subscriptionTier: data.subscriptionTier,
          createdAt: new Date(),
          lastActive: new Date(),
          settings: { ...DEFAULT_SETTINGS },
          stats: { ...DEFAULT_STATS },
          isDemo: data.isDemo || false,
          // Educator-specific fields
          ffa_chapter_id: data.ffa_chapter_id,
          educator_role: data.educator_role,
          certification: data.certification,
          years_experience: data.years_experience,
          students_supervised: data.type === 'educator' ? [] : undefined
        };

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          currentProfile: state.profiles.length === 0 ? newProfile : state.currentProfile,
          isFirstLaunch: state.profiles.length === 0 ? false : state.isFirstLaunch
        }));

        console.log(`✅ Created profile: ${newProfile.name} (${newProfile.type})`);
        return newProfile;
      },

      updateProfile: async (id: string, updates: Partial<UserProfile>) => {
        set((state) => ({
          profiles: state.profiles.map(profile =>
            profile.id === id
              ? { ...profile, ...updates, lastActive: new Date() }
              : profile
          ),
          currentProfile: state.currentProfile?.id === id
            ? { ...state.currentProfile, ...updates, lastActive: new Date() }
            : state.currentProfile
        }));

        console.log(`✅ Updated profile: ${id}`);
      },

      deleteProfile: async (id: string) => {
        const { profiles, currentProfile } = get();
        const remainingProfiles = profiles.filter(p => p.id !== id);
        
        set({
          profiles: remainingProfiles,
          currentProfile: currentProfile?.id === id 
            ? (remainingProfiles.length > 0 ? remainingProfiles[0] : null)
            : currentProfile
        });

        console.log(`🗑️ Deleted profile: ${id}`);
      },

      switchProfile: async (id: string) => {
        const { profiles } = get();
        const profile = profiles.find(p => p.id === id);
        
        if (profile) {
          // Update last active time
          await get().updateProfile(id, { lastActive: new Date() });
          
          set({ currentProfile: profile });
          console.log(`🔄 Switched to profile: ${profile.name}`);
        }
      },

      getCurrentProfile: () => {
        return get().currentProfile;
      },

      getAllProfiles: () => {
        return get().profiles;
      },

      updateProfileStats: async (id: string, stats: Partial<UserProfile['stats']>) => {
        const { profiles, currentProfile } = get();
        const profile = profiles.find(p => p.id === id);
        
        if (profile) {
          const updatedStats = { ...profile.stats, ...stats };
          await get().updateProfile(id, { stats: updatedStats });
        }
      },

      setFirstLaunchComplete: () => {
        set({ isFirstLaunch: false });
      },

      createDemoProfiles: async () => {
        const { profiles, createProfile } = get();
        
        // Don't create demo profiles if they already exist
        if (profiles.some(p => p.isDemo)) {
          // Migration: Update existing demo profiles to have ffa_chapter_id
          const demoProfiles = profiles.filter(p => p.isDemo);
          const needsUpdate = demoProfiles.some(p => 
            (['freemium_student', 'elite_student', 'educator'].includes(p.type)) && !p.ffa_chapter_id
          );
          
          if (needsUpdate) {
            console.log('🔄 Migrating demo profiles to include ffa_chapter_id');
            for (const profile of demoProfiles) {
              if (['freemium_student', 'elite_student', 'educator'].includes(profile.type) && !profile.ffa_chapter_id) {
                await get().updateProfile(profile.id, { 
                  ffa_chapter_id: 'demo_chapter_001' 
                });
              }
            }
          }
          return;
        }

        // Create Freemium Student profile
        const freemiumStudent = await createProfile({
          name: 'Freemium Student',
          type: 'freemium_student',
          school: 'ShowTrackAI Demo School',
          grade: '11',
          chapter: 'Demo FFA Chapter',
          subscriptionTier: 'Free',
          isDemo: true,
          ffa_chapter_id: 'demo_chapter_001'
        });

        // Create Elite Student profile
        const eliteStudent = await createProfile({
          name: 'Elite Student',
          type: 'elite_student',
          school: 'ShowTrackAI Demo School',
          grade: '12',
          chapter: 'Demo FFA Chapter',
          subscriptionTier: 'Professional',
          isDemo: true,
          ffa_chapter_id: 'demo_chapter_001'
        });

        // Create Educator profile
        const educator = await createProfile({
          name: 'Ms. Rodriguez',
          type: 'educator',
          school: 'ShowTrackAI Demo School',
          grade: 'Teacher', // Using grade field for role
          chapter: 'Demo FFA Chapter',
          subscriptionTier: 'Professional',
          isDemo: true,
          ffa_chapter_id: 'demo_chapter_001',
          educator_role: 'agriculture_teacher',
          certification: ['Agriculture Education', 'FFA Advisor', 'Animal Science'],
          years_experience: 8
        });

        // Add some demo data to make profiles look realistic
        await get().updateProfileStats(freemiumStudent.id, {
          animalsManaged: 3,
          journalEntries: 15,
          totalHoursLogged: 480, // 8 hours
          achievementsEarned: 2
        });

        await get().updateProfileStats(eliteStudent.id, {
          animalsManaged: 12,
          journalEntries: 45,
          totalHoursLogged: 1800, // 30 hours
          achievementsEarned: 8
        });

        await get().updateProfileStats(educator.id, {
          animalsManaged: 25, // Managing student animals
          journalEntries: 8, // Educator notes/observations
          totalHoursLogged: 2400, // 40 hours supervision
          achievementsEarned: 12 // Professional development
        });

        // Establish educator-student relationships
        await get().updateProfile(educator.id, {
          students_supervised: [freemiumStudent.id, eliteStudent.id]
        });

        console.log('✅ Created demo profiles: Freemium Student, Elite Student & Educator');
      },

      getDemoProfiles: () => {
        return get().profiles.filter(p => p.isDemo);
      },

      checkLimitations: (profileId: string, action: string, count: number = 0) => {
        const { profiles } = get();
        const profile = profiles.find(p => p.id === profileId);
        
        if (!profile || !profile.isDemo) {
          return { allowed: true };
        }

        const profileType = PROFILE_TYPES[profile.type as keyof typeof PROFILE_TYPES];
        
        if (!('limitations' in profileType)) {
          return { allowed: true };
        }

        const limitations = profileType.limitations as any;

        switch (action) {
          case 'add_animal':
            if (limitations.maxAnimals !== -1 && profile.stats.animalsManaged >= limitations.maxAnimals) {
              return { 
                allowed: false, 
                message: `Freemium limit: Maximum ${limitations.maxAnimals} animals. Upgrade to Elite for unlimited animals.` 
              };
            }
            break;

          case 'add_photo':
            // This would need to be tracked in profile stats
            if (limitations.maxPhotos !== -1 && count >= limitations.maxPhotos) {
              return { 
                allowed: false, 
                message: `Freemium limit: Maximum ${limitations.maxPhotos} photos. Upgrade to Elite for unlimited photos.` 
              };
            }
            break;

          case 'ai_prediction':
            if (!limitations.aiPredictions) {
              return { 
                allowed: false, 
                message: 'AI predictions are not available in Freemium. Upgrade to Elite for AI-powered weight predictions.' 
              };
            }
            break;

          case 'advanced_analytics':
            if (!limitations.advancedAnalytics) {
              return { 
                allowed: false, 
                message: 'Advanced analytics are not available in Freemium. Upgrade to Elite for detailed insights.' 
              };
            }
            break;

          case 'export':
            const format = count; // format passed as count parameter
            if (!limitations.exportFormats.includes(format)) {
              return { 
                allowed: false, 
                message: `${format.toUpperCase()} export is not available in Freemium. Upgrade to Elite for all export formats.` 
              };
            }
            break;
        }

        return { allowed: true };
      }
    }),
    {
      name: 'profile-store',
      partialize: (state) => ({
        profiles: state.profiles,
        currentProfile: state.currentProfile,
        isFirstLaunch: state.isFirstLaunch
      })
    }
  )
);