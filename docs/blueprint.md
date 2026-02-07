# **App Name**: Unsaid/Unheard

## Core Features:

- Platform Features: Single accessibility-first super-app with multimodal input and output support. Includes first-time setup for input/output modes, language, and accessibility style. Bottom navigation with 7 tabs: Home, Communicate, Sign, Community, Volunteer, Learn, News. User roles: Primary users, Supporters/Volunteers. Accessibility preferences stored per user.
- HOME (Safe Presence / Listener): Daily prompt allowing one word, voice, sign, or silence. Features a reflection-only AI response with tentative reflection and open validation. No judgment, no pressure, no performance. Uses Listener Brain AI tool.
- COMMUNICATE: AAC mode for non-speaking/speech disability. Gemini converts taps into short, medium, or long sentences with one-tap Speak Out Loud. Conversation Mode with fast back-and-forth and saved quick phrases. Deaf/Hard-of-Hearing mode with live speech to captions and speaker labels. Tap-to-reply suggestions. Blind/Low-vision mode with read with camera (text to spoken audio) and explain simply (complex text to easy-read). Audio-first UI.
- SIGN: Sign language detection via camera. Gemini video understanding outputs recognized text, confidence, and timestamps from a short 3-6 second clip. Sign output mode for News/Education/Posts with Sign Cards and optional Sign Clip Tokens.
- COMMUNITY: Posting features: achievements, daily progress, thoughts, reflections, nature, feelings, learning updates, 'I want to talk to people,' 'I want support.' Post input methods: type, voice, AAC taps, sign clip, camera photo. Accessibility rendering for every post: auto-generate audio version, captions-friendly version, easy-read version, optional translation.
- VOLUNTEER: User posts help request: 'I want 1 hour support for ___.' Volunteer offers 1 hour. User can accept or reject. Session room opens with chat, voice call + live captions, shared notes. Session end features: session summary, optional follow-up booking. Safety features: in-app communication only, session timer, exit session button, 'Do not share personal contact details' reminders.
- LEARN: Learning tracks: digital skills, communication confidence, career skills, academic basics, sign language learning, life skills. Every lesson available in text, audio, captions, easy-read.
- NEWS: One article becomes audio summary, easy-read bullets, key facts, and Sign Cards. Multimodal understanding of articles, images, videos, and documents.
- SAFETY & COMMUNITY CONTROLS: Verified volunteer badge. Post visibility controls: public, supporters-only, private. Comment controls per post: allow, restrict, disable. Block users, report users. Calm mode: hides comments, reduces notifications. AI safety style: never judgmental, never corrective, no pressure.
- GEMINI 3 Powered Features: Listener Brain (Home companion, reflection-only). Accessibility Transformer: text/image/doc to easy-read, audio script, summary. AAC Voice Builder: icons/phrases to natural speech. Sign Interpreter: short video to text + timestamps. News Explainer: article to key facts + simplified + sign cards. Volunteer Matchmaker: request to category, best volunteer fit, session agenda. These are implemented using the Gemini 3 AI tool.
- DATA & CONTENT FEATURES: Collections: users (preferences, modes, languages, roles), posts (raw + accessible variants), comments, reactions, help_requests, volunteer_offers, sessions (chat + notes + summary), lessons (multi-format), news_saved.
- DEMO & BUILD FEATURES: 7-tab UI shell. Accessibility settings applied globally. Gemini endpoints: /api/listen, /api/transform, /api/aac, /api/news, /api/sign. Post creation via text, voice, AAC, sign. Post rendering in audio, easy-read. Session room with captions. Demo lessons. Demo news topics. Sign cards output. Offline fallback sample outputs.

## Style Guidelines:

- Primary color: White for neutrality and clarity.
- Background color: Green (#4CAF50) to evoke a sense of calmness and growth.
- Body and headline font: 'Inter' for a clean, modern, and highly readable interface. Its neutral design supports accessibility for users with varying visual needs.
- Code font: 'Source Code Pro' for any instances of displaying code or technical information, ensuring clarity and distinction.
- Use clear, high-contrast icons that are easily recognizable and scalable to different sizes for various accessibility needs. Simple, universal symbols should represent common actions and categories.
- Employ a clean and intuitive layout with ample spacing and clear visual hierarchy. Ensure content is easily navigable and adaptable to different screen sizes and orientations.
- Use subtle animations to guide the user through the interface and provide feedback on interactions. Animations should be used sparingly and with consideration for users who may be sensitive to motion.