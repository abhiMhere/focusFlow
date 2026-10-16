export interface Quote {
  id: string
  text: string
  author?: string
}

export const QUOTES: Quote[] = [
  { id: 'q1',  text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { id: 'q2',  text: 'You do not rise to the level of your goals. You fall to the level of your systems.' , author: 'James Clear' },
  { id: 'q3',  text: 'Focus on being productive instead of busy.' , author: 'Tim Ferriss' },
  { id: 'q4',  text: 'Almost everything will work again if you unplug it for a few minutes—including you.' },
  { id: 'q5',  text: 'Done is better than perfect.' },
  { id: 'q6',  text: 'Small daily improvements over time lead to stunning results.' },
  { id: 'q7',  text: 'Concentrate all your thoughts upon the work at hand. The sun\'s rays do not burn until brought to a focus.', author: 'Alexander Graham Bell' },
  { id: 'q8',  text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { id: 'q9',  text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
  { id: 'q10', text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { id: 'q11', text: 'What you do today can improve all your tomorrows.' },
  { id: 'q12', text: 'Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.', author: 'Paul J. Meyer' },
  { id: 'q13', text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
  { id: 'q14', text: 'Energy, not time, is the fundamental currency of high performance.' },
  { id: 'q15', text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { id: 'q16', text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
  { id: 'q17', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { id: 'q18', text: 'The most difficult thing is the decision to act, the rest is merely tenacity.', author: 'Amelia Earhart' },
  { id: 'q19', text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { id: 'q20', text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
  { id: 'q21', text: 'Every morning we are born again. What we do today matters most.', author: 'Buddha' },
  { id: 'q22', text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { id: 'q23', text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { id: 'q24', text: 'Motivation is what gets you started. Habit is what keeps you going.' },
  { id: 'q25', text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { id: 'q26', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { id: 'q27', text: 'Twenty years from now you will be more disappointed by the things that you didn\'t do than by the ones you did do.', author: 'Mark Twain' },
  { id: 'q28', text: 'The harder the conflict, the greater the triumph.' },
  { id: 'q29', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { id: 'q30', text: 'Success is not final, failure is not fatal: It is the courage to continue that counts.', author: 'Winston Churchill' },
  { id: 'q31', text: 'Deep work is the ability to focus without distraction on a cognitively demanding task.' },
  { id: 'q32', text: 'Rest is not idleness; it is the work of recovery.' },
  { id: 'q33', text: 'Your work is going to fill a large part of your life. The only way to be truly satisfied is to do what you believe is great work.', author: 'Steve Jobs' },
  { id: 'q34', text: 'One hour of focused work is worth three hours of distracted effort.' },
  { id: 'q35', text: 'Clarity about what matters most provides clarity about what does not.' },
]

export interface ProductivityIdea {
  id: string
  title: string
  description: string
}

export const PRODUCTIVITY_IDEAS: ProductivityIdea[] = [
  { id: 'pi1',  title: 'Time Blocking', description: 'Assign every hour of your day a specific task or activity. Treat these blocks like meetings you cannot skip.' },
  { id: 'pi2',  title: 'Eat the Frog', description: 'Start your day with the hardest or most dreaded task. Once it\'s done, everything else feels manageable.' },
  { id: 'pi3',  title: 'Prepare Tomorrow Tonight', description: 'Spend 5 minutes before bed writing down your top 3 priorities for tomorrow. Wake up with a clear direction.' },
  { id: 'pi4',  title: 'Two-Minute Rule', description: 'If a task takes less than two minutes, do it immediately instead of scheduling it.' },
  { id: 'pi5',  title: 'Single-Tasking', description: 'Close unnecessary tabs and apps. Work on one thing at a time. Multitasking reduces quality and increases stress.' },
  { id: 'pi6',  title: 'Notification Detox', description: 'Silence non-critical notifications for your next focus session. Check messages only at scheduled times.' },
  { id: 'pi7',  title: 'Walk Between Sessions', description: 'A 5–10 minute walk after a focus session refreshes your mind and boosts creativity more than scrolling does.' },
  { id: 'pi8',  title: 'Weekly Review', description: 'Spend 20 minutes every Sunday reviewing what you accomplished, what slipped, and what you want to focus on next week.' },
  { id: 'pi9',  title: 'Capture Everything', description: 'Keep a running inbox — a single place to capture ideas, tasks, and notes as they arise. Process it once a day.' },
  { id: 'pi10', title: 'Energy Management', description: 'Schedule your hardest cognitive work during your peak energy hours. Save admin and low-stakes tasks for low-energy windows.' },
  { id: 'pi11', title: 'The 5-4-3-2-1 Rule', description: 'When you don\'t feel like starting: count 5-4-3-2-1 and begin. The countdown interrupts hesitation.' },
  { id: 'pi12', title: 'Batch Similar Tasks', description: 'Group emails, calls, and administrative work into dedicated time slots rather than handling each as they arrive.' },
  { id: 'pi13', title: 'Define Done', description: 'Before starting a task, write one sentence defining what "done" looks like. Vague tasks expand indefinitely.' },
  { id: 'pi14', title: 'Digital Sunset', description: 'Stop looking at screens 30–60 minutes before bed. Read a physical book or journal instead. Sleep quality affects focus.' },
  { id: 'pi15', title: 'Celebrate Small Wins', description: 'Acknowledge every completed task, not just big milestones. Positive reinforcement builds momentum.' },
  { id: 'pi16', title: 'The 90-Minute Rhythm', description: 'Work in 90-minute focused blocks followed by 15–20 minute breaks. This aligns with your natural ultradian rhythm.' },
  { id: 'pi17', title: 'Context Switching Cost', description: 'Every time you switch tasks, you lose 15–20 minutes of mental momentum. Protect your focus streaks.' },
  { id: 'pi18', title: 'Pomodoro Technique', description: 'Work for 25 minutes, rest for 5. After four sessions, take a longer 15-minute break. Structure prevents burnout.' },
  { id: 'pi19', title: 'Clean Workspace', description: 'Spend 2 minutes tidying your desk before a session. A clutter-free environment reduces cognitive load.' },
  { id: 'pi20', title: 'Theme Your Days', description: 'Assign themes to days of the week (e.g. Monday = planning, Tuesday = deep work). Reduces decision fatigue.' },
  { id: 'pi21', title: 'Say No Strategically', description: 'Every "yes" to one thing is a "no" to something else. Protect your focus time by declining low-value requests.' },
  { id: 'pi22', title: 'The Parking Lot', description: 'Keep a notepad handy during focus sessions. When a stray thought appears, park it there and return to it later.' },
  { id: 'pi23', title: 'Hydrate Proactively', description: 'Dehydration reduces cognitive performance. Keep water visible at your desk and drink before you feel thirsty.' },
  { id: 'pi24', title: 'Deadline Compression', description: 'Give yourself 20% less time than you think you need for non-critical tasks. Parkinson\'s Law: work expands to fill time.' },
  { id: 'pi25', title: 'Morning Pages', description: 'Write 3 pages of freeform thoughts every morning. It clears mental clutter and surfaces your real priorities.' },
  { id: 'pi26', title: 'Deep Work Ritual', description: 'Create a consistent pre-focus ritual (e.g. make tea, open a specific playlist, close email). Signals your brain it\'s time to work.' },
  { id: 'pi27', title: 'Progress Over Perfection', description: 'A finished imperfect piece is infinitely more valuable than a perfect piece you never shipped.' },
  { id: 'pi28', title: 'Task Stacking', description: 'Pair a new habit with an existing one. Answer messages while walking, review notes while commuting.' },
]

// Deterministic selection based on date
function seedFromDate(dateStr: string): number {
  return dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

export function getDailyQuote(dateStr: string): Quote {
  const seed = seedFromDate(dateStr)
  return QUOTES[seed % QUOTES.length]
}

export function getDailyIdea(dateStr: string): ProductivityIdea {
  const seed = seedFromDate(dateStr) + 17 // offset so it differs from quote
  return PRODUCTIVITY_IDEAS[seed % PRODUCTIVITY_IDEAS.length]
}
