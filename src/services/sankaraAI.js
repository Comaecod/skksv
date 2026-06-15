import { SCHOOL_CONFIG, GRADING_SYSTEM } from '../config/schoolConfig';
import STAFF_DATA from '../data/staffDirectory.json';
import EXECUTIVE_COMMITTEE from '../data/executiveCommittee.json';

const SCHOOL = SCHOOL_CONFIG;

const APP_DESCRIPTION = `This is the official digital platform of ${SCHOOL.name}. Students can take assessments, view holiday homework, browse staff directory, view gallery, submit feedback, and access timed assessments.`;

function buildStaffContext() {
  const lines = [];
  const allStaff = [
    { type: 'Management', items: [STAFF_DATA.correspondent, STAFF_DATA.principal, STAFF_DATA.director] },
    { type: 'Admin Team', items: STAFF_DATA.adminTeam },
    { type: 'Teaching Staff', items: STAFF_DATA.staff },
  ];
  for (const group of allStaff) {
    lines.push(`\n${group.type}:`);
    for (const s of group.items) {
      const alias = s.alias ? ` (${s.alias})` : '';
      const subject = s.subject ? ` - ${s.subject}` : '';
      const onLeave = s.onLeave ? ' [On Leave]' : '';
      lines.push(`  ${s.salutation} ${s.name}${alias} - ${s.designation}${subject}${onLeave}`);
      if (s.career) {
        lines.push(`    Career: ${s.career}`);
      }
    }
  }
  lines.push('\n\nExecutive Committee:');
  for (const m of EXECUTIVE_COMMITTEE) {
    lines.push(`  ${m.salutation} ${m.name} - ${m.designation}`);
    if (m.description) lines.push(`    About: ${m.description}`);
  }
  return lines.join('\n');
}

const STAFF_CONTEXT = buildStaffContext();

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
      return SCHOOL.name + ' (' + SCHOOL.shortName + ') is a prestigious educational institution committed to academic excellence and holistic development of students, established under the patronage of the Sri Kanchi Kamakoti Peetham.';
    },
  },
  {
    id: 'about_shankaracharya',
    patterns: [
      /(who\s+is|about|tell\s+about)\s+(adi\s+)?shankara/,
      /adi\s+shankara(cha|charya)?/i,
      /shankara(cha|charya)/i,
      /about\s+shankaracharya/i,
      /who\s+(is|was)\s+(adi\s+)?shankaracharya/i,
    ],
    response: () => {
      return '**Adi Shankaracharya** (c. 788–820 CE) was one of the most revered philosophers and theologians in Hinduism. He consolidated the doctrine of Advaita Vedanta (non-duality) and established four mathas (monasteries) across India — in Sringeri, Dwarka, Puri, and Joshimath. His works include commentaries on the Brahma Sutras, Upanishads, and Bhagavad Gita. The Kanchi Kamakoti Peetham traces its lineage to Adi Shankaracharya, with its Acharyas serving as guardians of Sanatana Dharma.';
    },
  },
  {
    id: 'kanchi_pontiff',
    patterns: [
      /(current|present|now|36th)\s+(pontiff|acharya|swami|jagadguru)/i,
      /who\s+is\s+(the\s+)?(current|present)\s+(head|pontiff|acharya)/i,
      /(sri\s+)?shankara\s+vijayendra\s+saraswati/i,
      /(current|present)\s+(kanchi\s+)?(kamakoti\s+)?(peetam|mutt)\s+(head|pontiff|acharya)/i,
    ],
    response: () => {
      return 'The current (36th) Jagadguru of the Sri Kanchi Kamakoti Peetham is **Jagadguru Sri Shankara Vijayendra Saraswathi Shankaracharya Swamigal**. He is the 36th Acharya in the illustrious parampara (lineage) of the Peetham.';
    },
  },
  {
    id: 'kanchi_previous_pontiff',
    patterns: [
      /(previous|former|before|past|35th)\s+(pontiff|acharya|swami|jagadguru)/i,
      /(sri\s+)?jayendra\s+saraswati/i,
      /who\s+was\s+(the\s+)?(previous|former)\s+(head|pontiff|acharya)/i,
    ],
    response: () => {
      return 'The previous (35th) Jagadguru was **Jagadguru Sri Jayendra Saraswathi Shankaracharya Swamigal** (also known as the 70th Sankaracharya of Kanchi Kamakoti Peetham). He served as the head of the Peetham for many decades and was instrumental in guiding the spiritual and charitable activities of the mutt.';
    },
  },
  {
    id: 'kanchi_next_pontiff',
    patterns: [
      /(next|future|upcoming|successor|after)\s+(pontiff|acharya|swami|jagadguru)/i,
      /who\s+(will\s+be|is)\s+(the\s+)?(next|future)\s+(head|pontiff|acharya)/i,
    ],
    response: () => {
      return 'The next (37th) pontiff designate is **Jagadguru Sri Vidhusekara Jayendra Saraswathi Shankaracharya Swamigal**, who was formally anointed as the junior pontiff (Yuvaraja) and is being trained to succeed the current Acharya in due course.';
    },
  },
  {
    id: 'school_address_contact',
    patterns: [
      /(school\s+)?(address|location|where)/i,
      /(contact|reach|find)\s+(the\s+)?school/i,
      /school\s+(phone|email|timing|hours)/i,
      /what\s+(is\s+)?the\s+(address|phone|email)/i,
      /school\s+(open|close|working)\s+(time|hours)/i,
    ],
    response: () => {
      return SCHOOL.name + ' is located in **Boduppal, Hyderabad**. For the complete address, phone number, email, and school timings, please visit the **Contact** page from the navigation menu. You can also find a Google Maps link there for directions.';
    },
  },
  {
    id: 'staff_directory',
    patterns: [
      /(staff|teachers?|faculty|people)\s+(info|details|list|directory)/i,
      /(how\s+(many|much)|list)\s+(staff|teachers?|faculty)/i,
      /who\s+(works?|teaches?)\s+(at|in)\s+school/i,
      /staff\s+strength/i,
      /who\s+teaches\s+(\w+)/i,
      /tell\s+(me\s+)?about\s+(the\s+)?staff/i,
    ],
    response: (ctx) => {
      const text = ctx.userMessage.toLowerCase();

      const teachMatch = text.match(/who\s+teaches\s+(\w+)/i);
      if (teachMatch) {
        const subjectQuery = teachMatch[1].toLowerCase();
        const found = STAFF_DATA.staff.filter(s =>
          s.subject && s.subject.toLowerCase().includes(subjectQuery)
        );
        if (found.length) {
          return found.map(t =>
            `${t.salutation} ${t.name} (${t.alias ? t.alias + ', ' : ''}${t.designation}) teaches ${t.subject}`
          ).join('\n');
        }
      }

      const total = STAFF_DATA.staff.length;
      return `${SCHOOL.name} has a total of ${total} teaching staff members, ${STAFF_DATA.adminTeam.length} admin staff, plus the Principal, Correspondent, and Director.\n\n${STAFF_CONTEXT}`;
    },
  },
  {
    id: 'school_history',
    patterns: [
      /(school\s+)?(history|found(ed|ation)|establish(ed|ment)|since|started|founded)/i,
      /when\s+(was|is)\s+(the\s+)?school\s+(established|founded|started)/i,
      /how\s+old\s+is\s+(the\s+)?school/i,
    ],
    response: () => {
      return SCHOOL.name + ' is a prestigious institution affiliated to the CBSE board, functioning under the guidance and blessings of the Sri Kanchi Kamakoti Peetham. For detailed historical information about the school\'s founding year and milestones, please contact the school administration or visit the About page.';
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
    response: () => 'I can help you with:\n\n\u2022 Information about ' + SCHOOL.name + '\n\u2022 About Adi Shankaracharya and Kanchi Kamakoti Peetham\n\u2022 The current, previous, and next pontiffs\n\u2022 Navigating through the app\n\u2022 Steps to take assessments and quizzes\n\u2022 Grading system and results\n\u2022 Finding staff and contact info\n\u2022 Viewing holiday homework\n\u2022 Submitting feedback\n\nJust ask me anything!',
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

About Adi Shankaracharya:
Adi Shankaracharya (c. 788–820 CE) was a revered philosopher who consolidated Advaita Vedanta (non-duality). He established four mathas across India (Sringeri, Dwarka, Puri, Joshimath) and wrote commentaries on the Brahma Sutras, Upanishads, and Bhagavad Gita. The Kanchi Kamakoti Peetham traces its lineage to him.

Kanchi Kamakoti Peetham Pontiffs:
- Current (36th): Jagadguru Sri Shankara Vijayendra Saraswathi Shankaracharya Swamigal
- Previous (35th): Jagadguru Sri Jayendra Saraswathi Shankaracharya Swamigal
- Pontiff-designate (37th): Jagadguru Sri Vidhusekara Jayendra Saraswathi Shankaracharya Swamigal (Yuvaraja)

Your role:
- Help users navigate the app and find what they need
- Answer questions about the school, Adi Shankaracharya, and the Kanchi Kamakoti Peetham
- Guide students through taking assessments
- Explain features of the app
- Be concise, friendly, and helpful

The app has these sections:
- Home (/) - Landing page with image carousel and school stats
- Assessments (/assessments) - Take exams and quizzes (select exam type → class → subject)
- Holiday Homework (/holiday-homework) - View assignments by holiday/class/subject
- Staff Directory (/people) - Browse faculty and staff
- Gallery (/gallery) - View school photos and event images
- Contact (/contact) - School address, phone, email, Google Maps link
- Feedback (/feedback) - Submit suggestions, issues, or appreciation
- Timed Assessments (/timed-assessments) - Time-bound exams (MCQ or project)
- Reports (/reports) - View result reports (teacher/staff only)

Keep responses under 150 words. Be warm but professional. Use simple language suitable for students and parents. When asked about the Kanchi Mutt or pontiffs, answer with reverence and accuracy.

Staff Directory (full list of all staff members):
${STAFF_CONTEXT}

If a user asks about a specific staff member, teacher, or subject, use this list to give accurate details. If they ask "who teaches X", match the subject and return the relevant teacher's name and details.`;

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
