// Community Forum Service
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const forumService = {
  // Create post
  createPost: async (postData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const post = {
      ...postData,
      authorId: user.uid,
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'forumPosts'), post);
    return { id: docRef.id, ...post };
  },
  
  // Get all posts
  getPosts: async (category = null, limitCount = 50) => {
    let q;
    
    if (category) {
      q = query(
        collection(db, 'forumPosts'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'forumPosts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get single post
  getPost: async (postId) => {
    const docRef = doc(db, 'forumPosts', postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) throw new Error('Post not found');
    
    // Increment views
    await updateDoc(docRef, { views: increment(1) });
    
    return { id: docSnap.id, ...docSnap.data() };
  },
  
  // Update post
  updatePost: async (postId, data) => {
    await updateDoc(doc(db, 'forumPosts', postId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete post
  deletePost: async (postId) => {
    await deleteDoc(doc(db, 'forumPosts', postId));
    
    // Delete all comments
    const commentsQuery = query(
      collection(db, 'forumComments'),
      where('postId', '==', postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
  
  // Like post
  likePost: async (postId) => {
    await updateDoc(doc(db, 'forumPosts', postId), {
      likes: increment(1)
    });
  },
  
  // Add comment
  addComment: async (postId, commentData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const comment = {
      postId,
      ...commentData,
      authorId: user.uid,
      likes: 0,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'forumComments'), comment);
    
    // Increment post comment count
    await updateDoc(doc(db, 'forumPosts', postId), {
      comments: increment(1)
    });
    
    return { id: docRef.id, ...comment };
  },
  
  // Get comments for post
  getComments: async (postId) => {
    const q = query(
      collection(db, 'forumComments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Delete comment
  deleteComment: async (commentId, postId) => {
    await deleteDoc(doc(db, 'forumComments', commentId));
    
    // Decrement post comment count
    await updateDoc(doc(db, 'forumPosts', postId), {
      comments: increment(-1)
    });
  },
  
  // Like comment
  likeComment: async (commentId) => {
    await updateDoc(doc(db, 'forumComments', commentId), {
      likes: increment(1)
    });
  }
};

// Forum categories
export const ForumCategories = {
  GENERAL: 'general',
  FARMING_TIPS: 'farming_tips',
  MARKET_TRENDS: 'market_trends',
  SUCCESS_STORIES: 'success_stories',
  QUESTIONS: 'questions',
  NEWS: 'news'
};
