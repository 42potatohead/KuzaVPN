import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage
} from "react-native-appwrite";

// import { Client, Account } from 'react-native-appwrite';

// const client = new Client()
//     .setEndpoint('https://fra.cloud.appwrite.io/v1')
//     .setProject('682c17a30032d5639772')
//     .setPlatform('com.luca.gluapp');


export const config = {
  platform: "com.luca.datetime",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "68726a6e0016bfe4d311",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || "6879556c000d0cf07ca4",
  // Collection IDs
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "687955a3003481c49427",
  usersProfilesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILES_COLLECTION_ID || "users_profiles",
  datesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_DATES_COLLECTION_ID || "dates",
  journalsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOURNALS_COLLECTION_ID || "journals",
  photosCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PHOTOS_COLLECTION_ID || "photos",
  photoCommentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PHOTO_COMMENTS_COLLECTION_ID || "photo_comments",
  coupleNotesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_COUPLE_NOTES_COLLECTION_ID || "couple_notes",
  gamesProgressCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GAMES_PROGRESS_COLLECTION_ID || "games_progress",
  // Storage Buckets
  datePhotosBucketId: process.env.EXPO_PUBLIC_APPWRITE_DATE_PHOTOS_BUCKET_ID || "date-photos",
  // Functions
  sendReminderFunctionId: process.env.EXPO_PUBLIC_APPWRITE_SEND_REMINDER_FUNCTION_ID || "send-reminder-notifications",
  createCoupleFunctionId: process.env.EXPO_PUBLIC_APPWRITE_CREATE_COUPLE_FUNCTION_ID || "create-couple-relationship",
};

export const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const DATABASE_ID = config.databaseId;

// Sign up
export async function signUp(name: string, email: string, password: string) {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    if (user) {
      // Create session after successful signup
      await account.createEmailPasswordSession(email, password);
    }
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Sign in
export async function signIn(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Sign out (current session)
export async function signOut() {
  try {
    return await account.deleteSession("current");
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const session = await account.getSession("current");
    return session;
  } catch (error) {
    return null;
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return null;
    }

    const result = await account.get();
    if (!result || !result.$id) {
      return null;
    }

    const userAvatar = avatar.getInitials(result.name || result.email);
    return {
      ...result,
      avatar: userAvatar.toString(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get user profile from users collection
export async function getUserProfile(userId: string) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      config.usersCollectionId,
      [Query.equal('userId', userId)]
    );

    if (result.documents.length > 0) {
      return result.documents[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Get user profile from users_profiles collection (new schema)
export async function getUserProfileFromProfiles(userId: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.usersProfilesCollectionId,
      [Query.equal('user_id', userId)]
    );

    if (result.documents.length > 0) {
      return result.documents[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile from profiles:', error);
    return null;
  }
}

// Create or update user profile in users_profiles collection
export async function createUserProfileInProfiles(userData: {
  display_name: string;
  relationship_start_date?: string;
  timezone?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check if profile already exists
    const existingProfile = await getUserProfileFromProfiles(user.$id);

    if (existingProfile) {
      // Update existing profile
      const result = await databases.updateDocument(
        config.databaseId,
        config.usersProfilesCollectionId,
        existingProfile.$id,
        {
          ...userData,
          updated_at: new Date().toISOString(),
        }
      );
      return result;
    } else {
      // Create new profile
      const result = await databases.createDocument(
        config.databaseId,
        config.usersProfilesCollectionId,
        ID.unique(),
        {
          user_id: user.$id,
          ...userData,
          timezone: userData.timezone || 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      return result;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

// === DATE MANAGEMENT FUNCTIONS ===

// Create a new date/event
export async function createDate(dateData: {
  title: string;
  description?: string;
  date: string; // ISO date string
  time?: string;
  type?: string;
  location?: string;
  reminder_enabled?: boolean;
  reminder_time?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's couple_id from users_profiles
    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const result = await databases.createDocument(
      config.databaseId,
      config.datesCollectionId,
      ID.unique(),
      {
        ...dateData,
        created_by: user.$id,
        couple_id: coupleId,
        type: dateData.type || 'Date Night',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error creating date:', error);
    throw error;
  }
}

// Get dates for current user's couple
export async function getCouplesDates(month?: string, year?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    let queries = [Query.equal('couple_id', coupleId)];

    // Add date filtering if month/year provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      queries.push(Query.greaterThanEqual('date', startDate));
      queries.push(Query.lessThanEqual('date', endDate));
    }

    queries.push(Query.orderAsc('date'));

    const result = await databases.listDocuments(
      config.databaseId,
      config.datesCollectionId,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching dates:', error);
    throw error;
  }
}

// Update existing date
export async function updateDate(dateId: string, updateData: Partial<{
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  location: string;
  reminder_enabled: boolean;
  reminder_time: number;
}>) {
  try {
    const result = await databases.updateDocument(
      config.databaseId,
      config.datesCollectionId,
      dateId,
      {
        ...updateData,
        updated_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error updating date:', error);
    throw error;
  }
}

// Delete date
export async function deleteDate(dateId: string) {
  try {
    await databases.deleteDocument(
      config.databaseId,
      config.datesCollectionId,
      dateId
    );
    return true;
  } catch (error) {
    console.error('Error deleting date:', error);
    throw error;
  }
}

// === JOURNAL MANAGEMENT FUNCTIONS ===

// Create journal entry
export async function createJournal(journalData: {
  title: string;
  content: string;
  date: string;
  time?: string;
  mood?: string;
  is_private?: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const result = await databases.createDocument(
      config.databaseId,
      config.journalsCollectionId,
      ID.unique(),
      {
        ...journalData,
        created_by: user.$id,
        couple_id: coupleId,
        is_private: journalData.is_private || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error creating journal:', error);
    throw error;
  }
}

// Get journal entries
export async function getJournalEntries(isPrivateOnly = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    let queries = [Query.equal('couple_id', coupleId)];

    if (isPrivateOnly) {
      queries.push(Query.equal('is_private', true));
      queries.push(Query.equal('created_by', user.$id));
    }

    queries.push(Query.orderDesc('date'));

    const result = await databases.listDocuments(
      config.databaseId,
      config.journalsCollectionId,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching journals:', error);
    throw error;
  }
}

// Update journal entry
export async function updateJournal(journalId: string, updateData: Partial<{
  title: string;
  content: string;
  date: string;
  time: string;
  mood: string;
  is_private: boolean;
}>) {
  try {
    const result = await databases.updateDocument(
      config.databaseId,
      config.journalsCollectionId,
      journalId,
      {
        ...updateData,
        updated_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error updating journal:', error);
    throw error;
  }
}

// Delete journal entry
export async function deleteJournal(journalId: string) {
  try {
    await databases.deleteDocument(
      config.databaseId,
      config.journalsCollectionId,
      journalId
    );
    return true;
  } catch (error) {
    console.error('Error deleting journal:', error);
    throw error;
  }
}

// === PHOTO MANAGEMENT FUNCTIONS ===

// Upload photo to storage
export async function uploadPhoto(file: any, title?: string, description?: string, dateTaken?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Upload file to storage
    const fileUpload = await storage.createFile(
      config.datePhotosBucketId,
      ID.unique(),
      file
    );

    // Create photo metadata document
    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const photoDoc = await databases.createDocument(
      config.databaseId,
      config.photosCollectionId,
      ID.unique(),
      {
        file_id: fileUpload.$id,
        title: title || '',
        description: description || '',
        date_taken: dateTaken || new Date().toISOString(),
        uploaded_by: user.$id,
        couple_id: coupleId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    return { file: fileUpload, document: photoDoc };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

// Get photos for couple
export async function getCouplesPhotos() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const result = await databases.listDocuments(
      config.databaseId,
      config.photosCollectionId,
      [
        Query.equal('couple_id', coupleId),
        Query.orderDesc('date_taken')
      ]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching photos:', error);
    throw error;
  }
}

// Get photo file URL
export function getPhotoUrl(fileId: string) {
  return storage.getFileView(config.datePhotosBucketId, fileId);
}

// Update photo metadata
export async function updatePhoto(photoId: string, updateData: Partial<{
  title: string;
  description: string;
  date_taken: string;
  location: string;
}>) {
  try {
    const result = await databases.updateDocument(
      config.databaseId,
      config.photosCollectionId,
      photoId,
      {
        ...updateData,
        updated_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error updating photo:', error);
    throw error;
  }
}

// Delete photo
export async function deletePhoto(photoId: string, fileId: string) {
  try {
    // Delete photo metadata document
    await databases.deleteDocument(
      config.databaseId,
      config.photosCollectionId,
      photoId
    );

    // Delete file from storage
    await storage.deleteFile(config.datePhotosBucketId, fileId);

    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

// === PHOTO COMMENTS FUNCTIONS ===

// Create photo comment
export async function createPhotoComment(commentData: {
  photo_id: string;
  message: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const result = await databases.createDocument(
      config.databaseId,
      config.photoCommentsCollectionId,
      ID.unique(),
      {
        photo_id: commentData.photo_id,
        message: commentData.message,
        author_id: user.$id,
        author_name: user.name || 'Unknown',
        couple_id: coupleId,
        created_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error creating photo comment:', error);
    throw error;
  }
}

// Get comments for a photo
export async function getPhotoComments(photoId: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.photoCommentsCollectionId,
      [
        Query.equal('photo_id', photoId),
        Query.orderAsc('created_at')
      ]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching photo comments:', error);
    throw error;
  }
}

// === COUPLE NOTES FUNCTIONS ===

// Create couple note (removed notetype as requested)
export async function createCoupleNote(noteData: {
  message: string;
  to_user_id: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    const result = await databases.createDocument(
      config.databaseId,
      config.coupleNotesCollectionId,
      ID.unique(),
      {
        message: noteData.message,
        from_user_id: user.$id,
        to_user_id: noteData.to_user_id,
        couple_id: coupleId,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error creating couple note:', error);
    throw error;
  }
}

// Get couple notes for current user
export async function getCoupleNotes(unreadOnly = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    let queries = [Query.equal('to_user_id', user.$id)];

    if (unreadOnly) {
      queries.push(Query.equal('is_read', false));
    }

    queries.push(Query.orderDesc('created_at'));

    const result = await databases.listDocuments(
      config.databaseId,
      config.coupleNotesCollectionId,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching couple notes:', error);
    throw error;
  }
}

// Mark note as read
export async function markNoteAsRead(noteId: string) {
  try {
    const result = await databases.updateDocument(
      config.databaseId,
      config.coupleNotesCollectionId,
      noteId,
      {
        is_read: true,
      }
    );
    return result;
  } catch (error) {
    console.error('Error marking note as read:', error);
    throw error;
  }
}

// === GAMES PROGRESS FUNCTIONS ===

// Create or update game progress
export async function updateGameProgress(gameData: {
  game_name: string;
  progress_data?: string;
  score?: number;
  completed?: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    // Check if progress already exists
    const existing = await databases.listDocuments(
      config.databaseId,
      config.gamesProgressCollectionId,
      [
        Query.equal('couple_id', coupleId),
        Query.equal('game_name', gameData.game_name)
      ]
    );

    if (existing.documents.length > 0) {
      // Update existing progress
      const result = await databases.updateDocument(
        config.databaseId,
        config.gamesProgressCollectionId,
        existing.documents[0].$id,
        {
          progress_data: gameData.progress_data,
          score: gameData.score || 0,
          completed: gameData.completed || false,
          last_played: new Date().toISOString(),
        }
      );
      return result;
    } else {
      // Create new progress
      const result = await databases.createDocument(
        config.databaseId,
        config.gamesProgressCollectionId,
        ID.unique(),
        {
          game_name: gameData.game_name,
          couple_id: coupleId,
          progress_data: gameData.progress_data || '',
          score: gameData.score || 0,
          completed: gameData.completed || false,
          last_played: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      );
      return result;
    }
  } catch (error) {
    console.error('Error updating game progress:', error);
    throw error;
  }
}

// Get game progress for couple
export async function getGameProgress(gameName?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userProfile = await getUserProfileFromProfiles(user.$id);
    const coupleId = userProfile?.couple_id || `single_${user.$id}`;

    let queries = [Query.equal('couple_id', coupleId)];

    if (gameName) {
      queries.push(Query.equal('game_name', gameName));
    }

    queries.push(Query.orderDesc('last_played'));

    const result = await databases.listDocuments(
      config.databaseId,
      config.gamesProgressCollectionId,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching game progress:', error);
    throw error;
  }
}


