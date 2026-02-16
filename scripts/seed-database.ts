/**
 * Database Seed Script for UNHEARD Application
 * 
 * This script populates the Firebase Firestore database with initial data:
 * - Learning tracks
 * - Sample lessons
 * - News articles
 * - AAC communication items
 * 
 * Run this script to set up the database for production use.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Learning Tracks
const learningTracks = [
  { 
    id: 'digital-skills',
    title: "Digital Skills", 
    slug: "digital-skills",
    description: "Learn to navigate the digital world.",
    order: 1
  },
  { 
    id: 'communication-confidence',
    title: "Communication Confidence", 
    slug: "communication-confidence",
    description: "Build skills for effective communication.",
    order: 2
  },
  { 
    id: 'career-skills',
    title: "Career Skills", 
    slug: "career-skills",
    description: "Get ready for the workplace.",
    order: 3
  },
  { 
    id: 'academic-basics',
    title: "Academic Basics", 
    slug: "academic-basics",
    description: "Strengthen your reading and math skills.",
    order: 4
  },
  { 
    id: 'sign-language',
    title: "Sign Language", 
    slug: "sign-language",
    description: "Start your journey learning to sign.",
    order: 5
  },
  { 
    id: 'life-skills',
    title: "Life Skills", 
    slug: "life-skills",
    description: "Master everyday tasks and challenges.",
    order: 6
  },
];

// Sample Lessons
const sampleLessons = [
  {
    id: 'digital-skills-1',
    title: "Getting Started with Email",
    track: "Digital Skills",
    trackSlug: "digital-skills",
    text: `Email is a powerful tool for communication in today's world. In this lesson, you'll learn how to send and receive emails, organize your inbox, and stay safe online.

Key Points:
1. Creating an email account
2. Sending your first email
3. Understanding the inbox, sent, and trash folders
4. Recognizing spam and phishing attempts
5. Using email attachments safely

Remember: Never share your password with anyone, and be cautious about clicking links in emails from unknown senders.`,
    order: 1
  },
  {
    id: 'communication-confidence-1',
    title: "Active Listening Skills",
    track: "Communication Confidence",
    trackSlug: "communication-confidence",
    text: `Active listening is one of the most important communication skills. It means fully concentrating on what someone is saying, understanding their message, and responding thoughtfully.

Key Techniques:
1. Make eye contact
2. Avoid interrupting
3. Ask clarifying questions
4. Summarize what you heard
5. Show empathy and understanding

Practice these skills in your daily conversations to become a better communicator!`,
    order: 1
  },
  {
    id: 'life-skills-1',
    title: "Budgeting Basics",
    track: "Life Skills",
    trackSlug: "life-skills",
    text: `Managing money is an essential life skill. A budget helps you track your income and expenses so you can save for your goals.

Steps to Create a Budget:
1. List all sources of income
2. Track all expenses for a month
3. Categorize expenses (needs vs. wants)
4. Set savings goals
5. Review and adjust monthly

Remember the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.`,
    order: 1
  }
];

// News Articles
const newsArticles = [
  {
    id: 'renewable-energy-breakthrough',
    title: 'Major Breakthrough in Renewable Energy Technology Announced',
    imageUrl: 'https://picsum.photos/seed/renewable-energy/1200/800',
    imageHint: 'abstract technology',
    content: `Scientists have announced a significant breakthrough in renewable energy storage, potentially revolutionizing how we power our world. The new technology, based on a novel crystalline material, can store solar and wind energy with unprecedented efficiency, boasting a 95% energy return rate. This development addresses the critical issue of intermittency in renewable sources, ensuring a stable power supply even when the sun isn't shining or the wind isn't blowing. Experts believe this could accelerate the global transition away from fossil fuels by making green energy more reliable and cost-effective than ever before. The research team is now working on scaling up production for commercial use, with pilot projects expected within the next two years.`,
    createdAt: Timestamp.now()
  },
  {
    id: 'exoplanet-discovery',
    title: 'New Deep-Space Telescope Discovers Potentially Habitable Exoplanet',
    imageUrl: 'https://picsum.photos/seed/exoplanet-discovery/1200/800',
    imageHint: 'galaxy stars',
    content: `Astronomers are buzzing with excitement after the new Orion Deep-Field Telescope captured images of an Earth-sized exoplanet orbiting within the habitable zone of a nearby star. The planet, named "Zetura-B," shows atmospheric signatures that could indicate the presence of water vapor. While more data is needed, this discovery marks a pivotal moment in the search for life beyond our solar system. The Orion telescope, launched just last year, has already exceeded expectations with its advanced imaging capabilities.`,
    createdAt: Timestamp.now()
  },
  {
    id: 'ai-drug-discovery',
    title: 'AI-Powered Drug Discovery Platform Accelerates Cancer Research',
    imageUrl: 'https://picsum.photos/seed/drug-discovery/1200/800',
    imageHint: 'dna microscope',
    content: `A new artificial intelligence platform developed by researchers at the Institute for Computational Medicine is drastically speeding up the process of discovering potential cancer-fighting drugs. By analyzing vast datasets of genetic information and molecular structures, the AI can identify promising compound candidates in a matter of days, a process that traditionally takes years. This innovation is expected to significantly reduce the cost and time of drug development, bringing new treatments to patients faster.`,
    createdAt: Timestamp.now()
  },
];

// AAC Items
const aacItems = [
  { id: 'drink', label: 'Drink', iconName: 'Coffee', order: 1 },
  { id: 'eat', label: 'Eat', iconName: 'Apple', order: 2 },
  { id: 'happy', label: 'Happy', iconName: 'Smile', order: 3 },
  { id: 'sad', label: 'Sad', iconName: 'Frown', order: 4 },
  { id: 'tired', label: 'Tired', iconName: 'Bed', order: 5 },
  { id: 'home', label: 'Home', iconName: 'Home', order: 6 },
  { id: 'day', label: 'Day', iconName: 'Sun', order: 7 },
  { id: 'night', label: 'Night', iconName: 'Moon', order: 8 },
  { id: 'help', label: 'Help', iconName: 'HandHelping', order: 9 },
  { id: 'yes', label: 'Yes', iconName: 'Check', order: 10 },
  { id: 'no', label: 'No', iconName: 'X', order: 11 },
  { id: 'thank-you', label: 'Thank You', iconName: 'Heart', order: 12 },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed Learning Tracks
    console.log('📚 Seeding learning tracks...');
    for (const track of learningTracks) {
      await setDoc(doc(db, 'learning_tracks', track.id), track);
      console.log(`  ✓ ${track.title}`);
    }

    // Seed Lessons
    console.log('\n📖 Seeding sample lessons...');
    for (const lesson of sampleLessons) {
      await setDoc(doc(db, 'lessons', lesson.id), lesson);
      console.log(`  ✓ ${lesson.title}`);
    }

    // Seed News Articles
    console.log('\n📰 Seeding news articles...');
    for (const article of newsArticles) {
      await setDoc(doc(db, 'news_articles', article.id), article);
      console.log(`  ✓ ${article.title}`);
    }

    // Seed AAC Items
    console.log('\n💬 Seeding AAC communication items...');
    for (const item of aacItems) {
      await setDoc(doc(db, 'aac_items', item.id), item);
      console.log(`  ✓ ${item.label}`);
    }

    console.log('\n✅ Database seeding complete!');
    console.log('\nSeeded collections:');
    console.log(`  - learning_tracks: ${learningTracks.length} documents`);
    console.log(`  - lessons: ${sampleLessons.length} documents`);
    console.log(`  - news_articles: ${newsArticles.length} documents`);
    console.log(`  - aac_items: ${aacItems.length} documents`);
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('\n✨ All done! Your database is ready to use.');
  process.exit(0);
});
