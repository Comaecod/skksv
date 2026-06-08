import { SCHOOL_CONFIG, GRADING_SYSTEM } from '../config/schoolConfig';

const SCHOOL = SCHOOL_CONFIG;

const APP_DESCRIPTION = `This is the official digital platform of ${SCHOOL.name}. Students can take assessments, view holiday homework, browse staff directory, view gallery, submit feedback, and access timed assessments.`;

const INTENTS = [
  {
    id: 'greeting',
    patterns: [
      /^(hi|hello|hey|namaskaram|vanakkam|good\s*(morning|afternoon|evening|day))\b/i,
      /^hey\s+sankara/i,
    ],
    response: (ctx) => {
      const time = new Date().getHours();
      const greeting = time < 12 ? 'Good morning' : time < 17 ? 'Good afternoon' : 'Good evening';
      return greeting + '! \u{1F91D} I\'m Sankara, your AI assistant for ' + (SCHOOL.shortName || SCHOOL.name) + '. How can I help you today?';
    }
  },
  {
    id: 'who_principal',
    patterns: [
      /who\s+is\s+(the\s+)?principal/i,
      /principal\s*(name|info|details)/i,
      /tell\s+(me\s+)?about\s+(the\s+)?principal/i,
      /principal\s+qualifications/i,
    ],
    response: () => {
      const p = SCHOOL.principal;
      const qual = p.qualifications ? '.\n\nQualifications: ' + p.qualifications : '.';
      return 'The ' + p.designation + ' of ' + SCHOOL.name + ' is ' + p.salutation + ' ' + p.name + qual;
    }
  },
  {
    id: 'who_correspondent',
    patterns: [
      /who\s+is\s+(the\s+)?correspondent/i,
      /correspondent\s*(name|info|details)/i,
      /tell\s+(me\s+)?about\s+(the\s+)?correspondent/i,
    ],
    response: () => {
      const c = SCHOOL.correspondence;
      return `The ${c.designation} is ${c.salutation} ${c.name}.`;
    }
  },
  {
    id: 'who_director',
    patterns: [
      /who\s+is\s+(the\s+)?director/i,
      /director\s*(name|info|details)/i,
      /tell\s+(me\s+)?about\s+(the\s+)?director/i,
    ],
    response: () => {
      const d = SCHOOL.director;
      const qual = d.qualifications ? '.\n\nQualifications: ' + d.qualifications : '.';
      return 'The ' + d.designation + ' is ' + d.salutation + ' ' + d.name + qual;
    }
  },
  {
    id: 'school_info',
    patterns: [
      /about\s+(the\s+)?school/i,
      /school\s*(info|details|information|name)/i,
      /what\s+is\s+(this\s+)?school/i,
      /tell\s+(me\s+)?about\s+school/i,
      /full\s+(name\s+)?of\s+school/i,
    ],
    response: () => {
      return SCHOOL.name + ' (' + SCHOOL.shortName + ') is a prestigious educational institution committed to academic excellence and holistic development of students.';
    },
  },
  {
    id: 'navigation',
    patterns: [
      /how\s+(do\s+)?(i\s+)?(go\s+to|find|open|access|navigate\s+to)/i,
      /where\s+(is|can\s+i\s+find|do\s+i\s+go)/i,
      /take\s+(me\s+)?to/i,
      /navigate/i,
    ],
    response: (ctx) => {
      const text = ctx.userMessage.toLowerCase();
      const pageMap = [
        { keywords: ['home', 'main'], path: '/', name: 'Home' },
        { keywords: ['assessment', 'exam', 'test', 'quiz'], path: '/assessments', name: 'Assessments' },
        { keywords: ['homework', 'holiday'], path: '/holiday-homework', name: 'Holiday Homework' },
        { keywords: ['staff', 'people', 'faculty', 'teacher', 'directory'], path: '/people', name: 'Staff Directory' },
        { keywords: ['gallery', 'photo', 'image', 'picture'], path: '/gallery', name: 'Gallery' },
        { keywords: ['contact', 'address', 'reach', 'location', 'map'], path: '/contact', name: 'Contact' },
        { keywords: ['feedback', 'suggestion'], path: '/feedback', name: 'Feedback' },
        { keywords: ['timed', 'time'], path: '/timed-assessments', name: 'Timed Assessments' },
      ];

      for (const page of pageMap) {
        if (page.keywords.some(k => text.includes(k))) {
          return `You can navigate to **${page.name}** by clicking the "${page.name}" link in the navigation menu.\n\nAlternatively, you can use this direct link within the app. Would you like me to help you with anything else on that page?`;
        }
      }

      const pages = ['Home', 'Assessments', 'Holiday Homework', 'Staff Directory', 'Gallery', 'Contact', 'Feedback', 'Timed Assessments'];
      return 'Here are the main sections of the app:\n\n' + pages.map(p => '\u2022 **' + p + '**').join('\n') + '\n\nWhich one would you like to visit? You can find them all in the navigation menu at the top of the page.';
    }
  },
  {
    id: 'assessments_help',
    patterns: [
      /how\s+(do\s+)?(i\s+)?take\s+(a\s+)?(test|exam|assessment|quiz)/i,
      /(test|exam|assessment|quiz)\s+(steps|guide|help|process)/i,
      /start\s+(a\s+)?(test|exam|assessment|quiz)/i,
    ],
    response: () => `To take an assessment:\n\n1. Go to **Assessments** from the navigation menu\n2. Select an exam type\n3. Choose your class\n4. Select a subject\n5. Review the introduction screen\n6. Enter the pre-assessment key (if required)\n7. Enter your name and roll number\n8. Answer the questions\n9. Submit to see your result and grade\n\nYou can also access **Timed Assessments** separately from the navigation menu for time-bound exams.`,
  },
  {
    id: 'contact',
    patterns: [
      /contact\s+(info|details|information|number|email)/i,
      /(phone|email|address)\s+(of\s+)?school/i,
      /how\s+(do\s+)?(i\s+)?(reach|contact)/i,
      /school\s+(address|location|phone|email)/i,
    ],
    response: () => `For school contact information, please visit the **Contact** page from the navigation menu. You can also find the school address and a link to view it on Google Maps there.`,
  },
  {
    id: 'grading',
    patterns: [
      /grading\s*(system|scheme|scale)/i,
      /(how\s+(is|are)\s+)?(scores?|marks?|grades?)\s+(calculated|given)/i,
      /what\s+(is\s+)?(the\s+)?grading/i,
      /grade\s+(system|scheme)/i,
    ],
    response: () => {
      const grades = Object.values(GRADING_SYSTEM).sort((a, b) => b.min - a.min);
      return 'The grading system is as follows:\n\n' + grades.map(g => g.grade + ' (' + g.min + '%+) - ' + g.label).join('\n') + '\n\nNote: The passing threshold is 33%.';
    }
  },
  {
    id: 'app_info',
    patterns: [
      /what\s+is\s+(this\s+)?app/i,
      /(tell\s+about|about)\s+(this\s+)?(app|application|platform)/i,
      /what\s+(can|does)\s+(this\s+)?(app|you)\s+(do|help)/i,
      /features?\s+of\s+app/i,
    ],
    response: () => APP_DESCRIPTION + '\n\nFeel free to ask me about any section or how to use them!',
  },
  {
    id: 'feedback_help',
    patterns: [
      /how\s+(do\s+)?(i\s+)?(give|submit|send)\s+feedback/i,
      /(feedback|suggestion)\s+(form|page|help)/i,
      /where\s+(do\s+)?(i\s+)?(give|submit)\s+feedback/i,
    ],
    response: () => `To submit feedback:\n\n1. Go to **Feedback** from the navigation menu\n2. Fill in your name and email (optional)\n3. Select a category (Suggestion, Issue, Appreciation, or Other)\n4. Write your message\n5. Submit the form\n\nYour feedback helps us improve!`,
  },
  {
    id: 'holiday_homework_help',
    patterns: [
      /(holiday\s+)?homework\s+(help|guide|how|find|view|access)/i,
      /how\s+(do\s+)?(i\s+)?view\s+homework/i,
      /where\s+(is\s+)?homework/i,
    ],
    response: () => `To view holiday homework:\n\n1. Go to **Holiday Homework** from the navigation menu\n2. Select the holiday type (e.g., Summer Vacation)\n3. Choose your class\n4. Select a subject to view the assignment`,
  },
  {
    id: 'timed_help',
    patterns: [
      /(timed|time.?bound)\s+(assessment|exam|test)\s+(help|guide|how)/i,
      /how\s+(do\s+)?(i\s+)?take\s+(a\s+)?timed/i,
    ],
    response: () => `Timed Assessments are time-bound exams. To take one:\n\n1. Go to **Timed Assessments** from the navigation menu\n2. Select your class\n3. Choose a subject\n4. Pick an available assessment (must be within its active date window)\n5. Enter your details and begin`,
  },
  {
    id: 'thanks',
    patterns: [
      /\b(thanks?|thank\s+you|thnx|ty)\b/i,
    ],
    response: () => `You're welcome! \u{1F60A} Let me know if you need any more help.`,
  },
  {
    id: 'capabilities',
    patterns: [
      /what\s+(can\s+)?you\s+(do|help)/i,
      /(your\s+)?(capabilities|features|skills)/i,
      /help\s+me/i,
    ],
    response: () => 'I can help you with:\n\n\u2022 Information about ' + SCHOOL.name + '\n\u2022 Navigating through the app\n\u2022 Steps to take assessments and quizzes\n\u2022 Grading system and results\n\u2022 Finding staff and contact info\n\u2022 Viewing holiday homework\n\u2022 Submitting feedback\n\nJust ask me anything!',
  },
  {
    id: 'who_made',
    patterns: [
      /who\s+(made|created|built|developed)\s+(you|this\s+app)/i,
      /(your\s+)?creator/i,
      /developer/i,
    ],
    response: () => 'I was created for ' + SCHOOL.name + ' to help students, parents, and staff navigate the school\'s digital platform with ease.',
  },
];

function findIntent(text) {
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(text.trim())) {
        return intent;
      }
    }
  }
  return null;
}

function cleanMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

function localQuery(userMessage, context) {
  const text = userMessage.trim().toLowerCase();

  const intent = findIntent(text);
  if (intent) {
    return { text: intent.response({ userMessage: text, ...context }), source: 'local' };
  }

  const currentPage = context.currentPage || '';
  if (currentPage) {
    return {
      text: `You're currently on the **${currentPage}** page. Try asking me about school info, navigation, assessments, or type "help" to see what I can do!`,
      source: 'local'
    };
  }

  const fallbacks = [
    'I\'m not sure I understand. Here are some things you can ask me:\n\n' + INTENTS.filter(i => !['greeting', 'thanks', 'fallback'].includes(i.id)).slice(0, 6).map(i => '\u2022 ' + i.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join('\n') + '\n\nOr just type "help" to see all my capabilities!',
    `I'm still learning! Try asking about the school, assessments, or navigation. Type "help" to see what I can do.`,
    `Hmm, I don't have an answer for that yet. Try asking me about school info, how to take a test, or navigating the app!`,
  ];

  return { text: fallbacks[Math.floor(Math.random() * fallbacks.length)], source: 'local' };
}

async function groqQuery(userMessage, context) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const systemPrompt = `You are Sankara, a friendly and knowledgeable AI assistant for ${SCHOOL.name} (${SCHOOL.shortName}). 

Key information about the school:
- Full name: ${SCHOOL.name}
- Short name: ${SCHOOL.shortName}
- Principal: ${SCHOOL.principal.salutation} ${SCHOOL.principal.name}
- Correspondent: ${SCHOOL.correspondence.salutation} ${SCHOOL.correspondence.name}
- Director: ${SCHOOL.director.salutation} ${SCHOOL.director.name}

Your role:
- Help users navigate the app and find what they need
- Answer questions about the school
- Guide students through taking assessments
- Explain features of the app
- Be concise, friendly, and helpful

The app has these sections:
- Home (/) - Landing page
- Assessments (/assessments) - Take exams and quizzes
- Holiday Homework (/holiday-homework) - View assignments
- Staff Directory (/people) - Browse faculty
- Gallery (/gallery) - View photos
- Contact (/contact) - School contact info
- Feedback (/feedback) - Submit feedback
- Timed Assessments (/timed-assessments) - Time-bound exams

Keep responses under 150 words. Be warm but professional. Use simple language suitable for students and parents.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(context.history || []).slice(-6),
    { role: 'user', content: userMessage }
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return { text: data.choices[0].message.content, source: 'groq' };
}

export async function getAIResponse(userMessage, context = {}) {
  if (!userMessage || !userMessage.trim()) {
    return { text: 'Please ask me something!', source: 'local' };
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (apiKey) {
    try {
      return await groqQuery(userMessage, context);
    } catch (e) {
      console.warn('Groq API failed, using local fallback:', e);
    }
  }

  return localQuery(userMessage, context);
}
