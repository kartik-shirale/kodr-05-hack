/**
 * Content specification for KODR Proctor Landing Page.
 * Source of truth: FEATURES.md
 * Strictly adheres to accuracy rules: benefit-led, honest, no internal tech names,
 * no unverified stats, no false promises.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface ProblemCard {
  title: string;
  description: string;
  iconName: "ShieldOff" | "EyeOff" | "AlertOctagon";
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  badge: string;
  iconName: "CalendarPlus" | "UserCheck" | "Camera" | "CheckCircle2";
}

export interface DetectionItem {
  id: string;
  title: string;
  description: string;
  iconName: "UserX" | "Users" | "Eye" | "Smartphone" | "Monitor";
  triggerCriteria: string;
}

export interface PrivacyItem {
  title: string;
  description: string;
  iconName: "CheckShield" | "FileKey" | "Clock" | "Lock" | "EyeOff" | "Server";
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const LANDING_CONTENT = {
  brand: {
    name: "KODR Proctor",
    tagline: "AI-Powered Online Examination & Proctoring",
    studentPortalName: "KODR Assessment",
  },

  nav: {
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Detections", href: "#detections" },
      { label: "Privacy", href: "#privacy" },
      { label: "FAQ", href: "#faq" },
    ] as NavLink[],
    teacherSignIn: "Sign in",
    teacherSignUp: "Get started",
    studentLogin: "Student login",
  },

  hero: {
    headline: "Fair, scalable online exams where AI flags and the teacher decides.",
    subhead:
      "Automated vision proctoring catches cheating in real time while intelligent filters eliminate false accusations. Keep complete grading authority with a transparent evidentiary audit trail.",
    primaryCta: "Get started",
    secondaryCta: "See how it works",
    highlightBadge: "Human-in-the-Loop Proctoring",
  },

  problemStrip: [
    {
      title: "Cheating is trivial online",
      description:
        "Secondary mobile devices, tab switches, and off-screen help undermine academic integrity when exams are unmonitored.",
      iconName: "ShieldOff",
    },
    {
      title: "Invigilator fatigue is real",
      description:
        "A single instructor cannot watch dozens of simultaneous webcam tiles without missing critical infraction moments.",
      iconName: "EyeOff",
    },
    {
      title: "Traditional tools are invasive",
      description:
        "Bloated background software and black-box algorithms wrongly flag honest students without giving teachers the context to decide.",
      iconName: "AlertOctagon",
    },
  ] as ProblemCard[],

  howItWorks: {
    heading: "How it works",
    subheading: "A seamless workflow designed for educator control and zero student friction.",
    steps: [
      {
        number: "01",
        title: "Create & schedule your test",
        description:
          "Set test duration, configure anti-collusion question sets, and define your custom warning policy and auto-submit rules.",
        badge: "Educator Portal",
        iconName: "CalendarPlus",
      },
      {
        number: "02",
        title: "Add students & email credentials",
        description:
          "Paste or upload your class list via CSV. Unique secure passwords and private join links are dispatched in one click.",
        badge: "Instant Delivery",
        iconName: "UserCheck",
      },
      {
        number: "03",
        title: "Students consent & take exam",
        description:
          "Students review plain-language rules, complete a local webcam check, and answer questions while AI vision monitors periodically.",
        badge: "Zero Installs",
        iconName: "Camera",
      },
      {
        number: "04",
        title: "Review flagged moments & decide",
        description:
          "Inspect chronological violation timelines with private snapshots. You mark items Valid or False Alarm—you make the final call.",
        badge: "Teacher Decides",
        iconName: "CheckCircle2",
      },
    ] as StepItem[],
  },

  featureShowcase: {
    testBuilder: {
      tag: "Anti-Collusion & Policy",
      title: "Build resilient tests with multiple question sets",
      description:
        "Distribute students round-robin across distinct sets (Set A, Set B) to prevent peer-to-peer sharing. Configure warning limits from 1 to 5 and choose whether to auto-submit when the threshold is crossed.",
      bullets: [
        "Multiple question sets with auto round-robin assignment",
        "Configurable warning limit (1 to 5) before termination",
        "Optional automated submission upon exceeding warning quota",
        "Test settings and questions lock at start time to prevent tampering",
      ],
    },
    studentManagement: {
      tag: "Zero Student Friction",
      title: "No student accounts to manage or create",
      description:
        "Students never need to download proprietary software or remember yet another password. Import your class roster via paste or CSV, and the platform delivers unique passwords and direct join links automatically.",
      bullets: [
        "Paste or CSV import with instant browser validation",
        "Auto-generated unique credentials stored securely hashed",
        "One-click credential dispatch with direct join URLs",
        "Per-student credential resend and status tracking",
      ],
    },
    liveMonitoring: {
      tag: "Real-Time Oversight",
      title: "Live session monitoring with automated risk tiers",
      description:
        "Track your entire cohort in real time with 20-second automatic polling. Sessions are grouped into High, Medium, and Low risk tiers based on cumulative weighted infractions, allowing you to prioritize review immediately.",
      bullets: [
        "Live monitoring indicator with automated 20s polling",
        "Filter and sort by Risk Tier (High, Medium, Low) and Status",
        "Real-time violation counters and warning counts",
        "Instant drill-down into any active student's session",
      ],
    },
    forensicReview: {
      tag: "Human-in-the-Loop",
      title: "Forensic audit timeline where you make the final call",
      description:
        "AI vision flags potential anomalies, but an algorithm never issues the final verdict. Review high-resolution private snapshots, check AI confidence notes, and mark events Valid or False Alarm with instant risk recalculation.",
      bullets: [
        "Chronological infraction timeline with millisecond precision",
        "Private still frame snapshot inspection for flagged moments",
        "One-click Valid, False Alarm, and Pending audit controls",
        "Marking False Alarm instantly lowers student risk score",
      ],
    },
    detectionTuning: {
      tag: "Total Calibration",
      title: "Fine-tune detection rules with false-alarm analytics",
      description:
        "Every academic environment is unique. Adjust sustained duration requirements (afterSec), warning cooldowns, and head yaw angles. Historical false-alarm rate metrics help you calibrate sensitivity before tests start.",
      bullets: [
        "Customize per-rule weights, warning flags, and cooldowns",
        "Adjust head-turn yaw angle thresholds and ignore-looking-down toggle",
        "Real-time false-alarm rate analytics calculated from teacher reviews",
        "Full rule lock once the exam start time arrives",
      ],
    },
  },

  detections: {
    heading: "Intelligent AI Vision Anomaly Detection",
    subheading:
      "Targeted visual checks designed specifically for online exam integrity, backed by temporal filters to protect honest test-takers.",
    items: [
      {
        id: "NO_FACE",
        title: "No Face Detected",
        description: "Flags when the student completely leaves the webcam frame during testing.",
        iconName: "UserX",
        triggerCriteria: "Sustained absence past configurable duration threshold (e.g. 3s)",
      },
      {
        id: "MULTIPLE_FACES",
        title: "Multiple Faces",
        description: "Detects two or more individuals present in the student's camera view.",
        iconName: "Users",
        triggerCriteria: "Instant multi-person detection with count verification",
      },
      {
        id: "LOOKING_AWAY",
        title: "Looking Away",
        description: "Tracks head orientation yaw and pitch away from the active exam screen.",
        iconName: "Eye",
        triggerCriteria: "Configurable yaw angle (e.g. 35°) with ignore-looking-down desk toggle",
      },
      {
        id: "PHONE_DETECTED",
        title: "Phone in View",
        description: "Identifies handheld mobile devices, smartphones, and tablets in the frame.",
        iconName: "Smartphone",
        triggerCriteria: "Confidence-rated object detection with duration buffer",
      },
      {
        id: "TAB_SWITCH",
        title: "Tab Switching",
        description: "Logs when the student navigates away from the exam tab or window loses focus.",
        iconName: "Monitor",
        triggerCriteria: "Browser visibility change and window blur monitoring",
      },
    ] as DetectionItem[],
    filtersNote: {
      title: "Fewer false alarms by design",
      description:
        "Every visual detection passes through a sustained-duration filter (must persist for afterSec) and a warning cooldown timer (warningCooldownSec). An accidental sneeze, momentary glance, or lighting flicker will not unfairly penalize a student.",
    },
  },

  studentExperience: {
    heading: "A transparent, low-stress student experience",
    subheading:
      "When expectations are clear and tools are reliable, students can focus completely on demonstrating their knowledge.",
    cards: [
      {
        step: "01",
        title: "Transparent Lobby & Check",
        description:
          "Students see exact test rules and warning limits upfront, accept academic consent, and run a local camera check before entering.",
      },
      {
        step: "02",
        title: "Focus-Mode Exam Room",
        description:
          "Distraction-free interface with debounced background auto-saving, a synchronized server timer, and a clear 5-minute warning alert.",
      },
      {
        step: "03",
        title: "Fair In-Exam Warnings",
        description:
          "If an infraction occurs, a clear modal informs the student (e.g. 'Warning 1 of 2') so they can correct their posture immediately.",
      },
    ],
  },

  privacyTrust: {
    heading: "Privacy-conscious by design",
    subheading:
      "We believe academic integrity should never require invasive continuous surveillance. Built with strict data minimization principles.",
    items: [
      {
        title: "Explicit Student Consent",
        description:
          "Students review complete monitoring rules and provide explicit consent before any camera capture begins.",
        iconName: "CheckShield",
      },
      {
        title: "No Continuous Video Recording",
        description:
          "No full-length video streams or hours of footage to store. Only periodic still frames are analyzed by AI vision.",
        iconName: "EyeOff",
      },
      {
        title: "Private Teacher-Only Snapshots",
        description:
          "Snapshots taken during flagged events are stored privately and accessible only by the authenticated instructor.",
        iconName: "Lock",
      },
      {
        title: "30-Day Auto-Deletion",
        description:
          "Event snapshots are automatically purged by scheduled maintenance jobs after 30 days to honor data retention standards.",
        iconName: "Clock",
      },
      {
        title: "Server-Authoritative Timing",
        description:
          "All exam clocks, durations, and session expiries are calculated on the server to prevent local client clock tampering.",
        iconName: "Server",
      },
      {
        title: "Hidden Answer Keys & Hardened Auth",
        description:
          "Correct answers are never transmitted to students. Accounts feature brute-force lockout and rotating token families.",
        iconName: "FileKey",
      },
    ] as PrivacyItem[],
  },

  benefits: {
    heading: "Built for both sides of the examination",
    subheading: "Academic rigor for institutions, fair treatment for students.",
    teachers: {
      role: "For Teachers & Institutions",
      badge: "Educator Control",
      points: [
        "Save countless hours of manual invigilation while maintaining rigor",
        "Multiple question sets automatically minimize peer collusion",
        "Granular calibration controls to fit strict or lenient course policies",
        "Complete evidentiary audit trail with snapshots and timestamps",
        "Full grading authority: AI assists by flagging, but you decide",
      ],
    },
    students: {
      role: "For Students & Test-Takers",
      badge: "Fair & Frictionless",
      points: [
        "Zero software downloads or permanent account credentials required",
        "Clear rules and pre-exam camera check eliminate surprises",
        "Fair warnings give honest students the chance to self-correct",
        "Sustained-duration filters protect against momentary slips",
        "No invasive hours-long surveillance video stored on servers",
      ],
    },
  },

  faq: [
    {
      question: "What is detected during an exam?",
      answer:
        "The AI vision proctoring engine periodically checks for five key indicators: absence of a face (leaving the frame), presence of multiple faces, head orientation turning away from the screen, mobile phones or tablets in view, and browser tab switches or window blurs.",
    },
    {
      question: "Can honest students be wrongly flagged, and who decides?",
      answer:
        "Yes, occasional anomalies can happen (such as looking down at scratch paper or temporary room changes). To prevent false accusations, detections require sustained duration (afterSec) before triggering, and warnings have cooldown periods. Most importantly, the AI does not ban or disqualify students on its own—the instructor reviews flagged snapshots and marks events as Valid or False Alarm. You make the final call.",
    },
    {
      question: "What data is stored and for how long?",
      answer:
        "The platform does NOT store continuous video footage. Only periodic still frames taken during flagged moments are saved. These snapshots are private, accessible exclusively to the authorized teacher, and automatically purged by background cleanup jobs after 30 days.",
    },
    {
      question: "Do students need to create an account or install an app?",
      answer:
        "No. Students do not need to create accounts or download browser extensions. Instructors paste or upload their class list, and the system automatically generates unique credentials and sends a direct join link to each student's email.",
    },
    {
      question: "What happens when the warning limit is exceeded?",
      answer:
        "When creating the test, the instructor defines a warning limit (between 1 and 5) and chooses whether to enable automated submission. If enabled and a student incurs an infraction beyond their maximum warnings, their session is automatically ended, saved, and submitted with reason WARNING_LIMIT for teacher review.",
    },
    {
      question: "Can test settings or rules be changed after the exam starts?",
      answer:
        "No. Once the scheduled start time arrives, test configurations, questions, warning policies, and tuning thresholds are strictly locked to prevent unfair mid-exam changes and ensure consistent conditions for all participants.",
    },
    {
      question: "Do students see their scores or correct answers immediately?",
      answer:
        "No. Answer keys are strictly stored on the server and are never sent to the student client. Scores are withheld upon completion to preserve test confidentiality and prevent answer leaking while other students may still be testing.",
    },
  ] as FaqItem[],

  ctaBanner: {
    headline: "Ready to run fair, secure, and respectful online exams?",
    subhead:
      "Join forward-thinking educators using AI vision proctoring with human-in-the-loop oversight.",
    primaryCta: "Get started as a Teacher",
    secondaryCta: "Have a test join link? Enter student portal",
  },

  footer: {
    copyright: `© ${new Date().getFullYear()} KODR Proctor. All rights reserved.`,
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Detections", href: "#detections" },
      { label: "Privacy & Trust", href: "#privacy" },
      { label: "FAQ", href: "#faq" },
    ],
    studentLink: "Student Exam Join",
    teacherLogin: "Teacher Login",
  },
};
