// Farm Showcase Service (Farmers Only)
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const farmShowcaseService = {
  // Create or update farm profile
  updateShowcase: async (showcaseData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    
    const showcase = {
      farmerId: user.uid,
      ...showcaseData,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(showcaseRef, showcase, { merge: true });
    return showcase;
  },
  
  // Get farm showcase
  getShowcase: async (farmerId) => {
    const showcaseRef = doc(db, 'farmShowcases', farmerId);
    const showcaseDoc = await getDoc(showcaseRef);
    
    if (!showcaseDoc.exists()) {
      return null;
    }
    
    return { id: showcaseDoc.id, ...showcaseDoc.data() };
  },
  
  // Add photo to gallery
  addPhoto: async (photoUrl, caption = '') => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    
    await updateDoc(showcaseRef, {
      gallery: arrayUnion({
        url: photoUrl,
        caption: caption,
        uploadedAt: new Date().toISOString()
      })
    });
  },
  
  // Remove photo from gallery
  removePhoto: async (photoUrl) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    const showcase = await farmShowcaseService.getShowcase(user.uid);
    
    if (showcase && showcase.gallery) {
      const photoToRemove = showcase.gallery.find(p => p.url === photoUrl);
      if (photoToRemove) {
        await updateDoc(showcaseRef, {
          gallery: arrayRemove(photoToRemove)
        });
      }
    }
  },
  
  // Add certification
  addCertification: async (certification) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    
    await updateDoc(showcaseRef, {
      certifications: arrayUnion({
        ...certification,
        addedAt: new Date().toISOString()
      })
    });
  },
  
  // Update farm story
  updateStory: async (story) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    
    await updateDoc(showcaseRef, {
      story: story,
      updatedAt: serverTimestamp()
    });
  },
  
  // Update farm details
  updateDetails: async (details) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const showcaseRef = doc(db, 'farmShowcases', user.uid);
    
    await updateDoc(showcaseRef, {
      farmName: details.farmName,
      farmSize: details.farmSize,
      farmingSince: details.farmingSince,
      specialties: details.specialties,
      farmingMethods: details.farmingMethods,
      updatedAt: serverTimestamp()
    });
  }
};
