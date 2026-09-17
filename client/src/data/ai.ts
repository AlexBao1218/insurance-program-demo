// EXPORTS: WELCOME_MESSAGE, SUGGESTED_QUESTIONS, NOTICE_TEXT, WRITEUP_URL
//
// Static copy for the assistant panel replica. In production this page embedded
// a Feishu Aily agent in an iframe; the public demo only reproduces its form.
// There is deliberately NO answer generation here — nothing may fabricate replies.

/** Assistant welcome line, rendered as plain text at the top of the panel */
export const WELCOME_MESSAGE =
  "Hi, I'm your insurance consultant. I can answer questions about the programme from 23/24 to 26/27, with sources you can verify."

/** Suggestion chips shown under "Try asking" */
export const SUGGESTED_QUESTIONS = [
  'What is our PARMBBI premium for 26/27?',
  'Show the EC premium trend over the last 4 years.',
  'How many Motor claims are still open?',
] as const

/** Body of the notice card that replaces a live answer in the public demo */
export const NOTICE_TEXT =
  "In production this panel was a Feishu Aily agent grounded on the programme's three Bitable tables (insurance classes, policies, claims). See the project write-up for what it could do."

/** Project write-up linked from the notice card */
export const WRITEUP_URL = 'https://zijun.cloud/en/projects/insurance-program'
