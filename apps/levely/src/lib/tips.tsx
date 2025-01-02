import type { Stats } from "~/types/types";
import { getStats } from "./storage";

export const priorities = {
  focus: "How to focus for hours",
  memory: "Memorize anything easily",
  reading: "Understand your reading",
  habits: "Build healthy habits",
  problemSolving: "Solve problems faster",
  productivity: "Work smarter, not harder",
  noteTaking: "Take effective notes",
  timeManagement: "Manage your time",
} satisfies Record<keyof Stats, string>;

export const tips = {
  focus: [
    {
      title: "The easy method",
      description: `The best method for making the friction between your study sessions and all the distractions of the world disappear is as follows.

Adopt the Pomodoro Technique: focus on a single task for 25 minutes, then take a 5-minute break. Find a balance between deep focus and what you enjoy, within these 5 minute breaks you can allow yourself to look at your phone.

Declutter: Reduce distractions by putting your phone on 'Do Not Disturb' mode and setting up a clutter-free workspace, a clear space equals a clear mind.

Saving the best for last is start using app-blocking tools like Soundscape, which have been proven to be the most effective focus technique for students in 2024, to limit access to distracting apps during study sessions.`,
      stars: 1,
    },
  ],
  memory: [
    {
      title: "The easy method",
      description: `If you're looking for a quick way of improving your memory, you've come to the wrong place because there simply isn't one.

But if you're stuck between a rock and a hard place use this method:

- Read it 10x
- Say it 10x 
- Write it 2x

OR...

- Read it silently in your mind
- Close your eyes, read in your mind
- Read it out loud
- Close your eyes, say it out loud`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `Use the active recall technique by testing yourself on what you've learned rather than passively reviewing notes. Pair this with spaced repetition for ultimate success.

Here's exactly how to do it:

The blurting method is the best memorization and retention technique according to science. It forces you to retrieve information from your memory using active recall.

1. Read a small section of your study material, this can be a part of a book, pdf, presentation, document you name it.

2. Once you have completed the reading session, remove the material from your vision so that you can't see it and start writing down everything that you remember, this is called the "blurt".

3. Once you have everything that you remember written down, go back to your notes and identify the information you forgot and fill in these memory lapses in your "blurt" with another color.

4. Continue this process until the information sticks then you move on to the next section.

How to really make this information engraved in your memory is by combining the blurting method with spaced repetition.

Spaced repetition involves reviewing information at increasing intervals over time to help move it from short-term to long-term memory. Instead of cramming, you revisit the material just before you're about to forget it, which strengthens your recall.

Example:

If you learn vocabulary words today, review them the next day (1-day gap), then after 3 days, then 7 days, and so on. For instance:

Day 1: Study the word "Eloquent."

Day 2: Review its meaning and use it in a sentence.

Day 5: Test yourself again and revise.

Day 12: Do a quick review and check if you still remember.`,
      stars: 2,
    },
  ],
  reading: [
    {
      title: "The easy method",
      description: `If you’re looking for a simple way to start reading faster, try these beginner-friendly techniques:

1. Use a pacer (finger or pen)
Move your finger, a pen, or a pointer under the line you’re reading. This helps your eyes follow the text more efficiently and reduces backtracking. Try moving the pacer slightly faster than your normal reading speed to push yourself.

2. Eliminate subvocalization
Subvocalization is when you “say” the words in your head as you read. Instead, focus on letting your eyes move over the text and absorb the meaning without mentally pronouncing every word.

3. Chunk words
Instead of reading word by word, train your eyes to group 3–5 words at a time. Practice with shorter sentences or headlines to get the hang of it.

4. Focus on the middle
Skip reading the first and last few words of a line. Your peripheral vision will naturally pick up those parts while you focus on the middle of the text. Start small and gradually apply this to larger chunks of text.`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `
For long-term speed reading mastery, focus on these advanced techniques:

1. Expand Peripheral Vision
Train your eyes to take in more words at a glance by practicing with a reading guide. For example:
Start with a narrow column of text and gradually increase the width.
Use tools like RSVP (Rapid Serial Visual Presentation) apps, which flash one word at a time to speed up comprehension.

2. Preview and Skim First
Quickly scan headings, subheadings, and bolded text to create a mental map of the material. This way, you know what’s important before you dive in. When reading, focus only on the key points instead of processing every detail.

3. Set Timed Reading Goals
Use a timer to challenge yourself. For example:
Set 10 minutes to finish a specific section or chapter.
Track how much you’ve read and aim to beat your own record over time.

4. The Z-Pattern or S-Pattern Technique
Let your eyes trace a zigzag or "Z" pattern across the page instead of reading line by line. This is particularly useful for skimming large amounts of text to get the gist.

5. Minimize Regression (Re-Reading)
Use a card or paper to cover the text you’ve already read. This prevents your eyes from wandering back and forces you to move forward.

6. Practice Speed Reading Drills
Dedicate 5–10 minutes daily to speed reading exercises. For instance:
Read a passage at double your usual speed (even if you don’t understand everything).
Then re-read it at a slightly slower speed for comprehension.`,
      stars: 2,
    },
  ],
  habits: [
    {
      title: "The easy method",
      description: `Habits is a difficult one, here there is no easy method but its entirely possible with hard work and the right framework.`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `Building strong habits relies on being in it for the long haul and understanding and leveraging the habit loop: cue, routine, and reward. Start by identifying a clear cue—something that triggers the habit you want to develop. For example, placing your study materials on your desk the night before can act as a visual cue to start studying the next morning.

Focus on starting small with goals that feel manageable. Instead of trying to study for three hours daily from the start, begin with 20 minutes and gradually increase as the habit solidifies. This approach reduces the overwhelm and increases your chances of sticking with the habit.

Consistency is key, and one of the best ways to achieve it is by anchoring new habits to existing ones. For instance, if you already brush your teeth in the morning, use that moment as a cue to review flashcards or set your daily study goals. Pairing habits together makes it easier to integrate new routines into your life.

Finally, celebrate your progress, no matter how small. Recognizing and rewarding yourself for sticking to your habits—like enjoying a favorite snack or taking a break—reinforces the routine and motivates you to continue. Remember, habits take time to build, but through patience and persistence, they can become second nature."`,
      stars: 2,
    },
  ],
  problemSolving: [
    {
      title: "The easy method",
      description: `A quick and efficient process for solving problems under time constraints

**1. Restate the Problem Clearly**
- Reframe the problem in simple terms
- Focus on:
  - What am I solving?
  - What is the goal?

**2. Break It Down**
- Separate into small parts:
  - What do I know?
  - What do I need to find?
- Simplify by removing unnecessary details or approximating variables

**3. Follow a Systematic Process**
- Input → Process → Output
- Think:
  - What do I have?
  - What action should I take? 
  - What result do I need?

**4. Test Your First Idea**
- Pick a starting point and act
- Even if incomplete, testing reveals new directions`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `
A structured and thorough process for solving complex problems:

**1. Understand the Problem**
- Rewrite it in your own words and identify the goal clearly
- Ask: What does a solution look like?

**2. Decompose Systematically**
- Knowns vs Unknowns: List what you have and what's missing
- Sub-Problems: Break it into steps that build toward the solution

**3. Apply Specific Strategies**
- Simplify: Replace messy variables with placeholders or ignore less relevant details
- Analogies: Recall similar problems you've solved before and adapt their solutions
- Visualize: Draw diagrams or flowcharts to organize your thoughts

**4. Test and Verify**
- Check edge cases and stress-test the solution
- Reflect: What worked well? What can I improve for next time?`,
      stars: 2,
    },
  ],
  productivity: [
    {
      title: "The easy method",
      description: `Being productive is a student is key to reaching your potential and a quick and easy way to structure your study sessions for ultimate productivity is using study ratios as follow:


| Work For       | Break Time      |
|----------------|-----------------|
| **20 min**     | 3 min           |
| **30 min**     | 5 min           |
| **45 min**     | 10 min          |
| **1 hr**       | 20 min          |
| **1 hr 30 min**| 45 min          |
| **1 hr 45 min**| 50 min          |
| **2 hr**       | 1 hr            |

**Note:**  
Don’t work more than two hours without a break. It may lead to burnout and lack of motivation!      `,
      stars: 1,
    },
    {
      title: "The best method",
      description: `To boost productivity, start by prioritizing your tasks using the Eisenhower Matrix. Categorize each task into one of four quadrants: urgent and important, important but not urgent, urgent but not important, and neither urgent nor important. Focus your energy on tasks that are both urgent and important, and schedule time for tasks that are important but not urgent to prevent them from becoming emergencies. Delegate or eliminate tasks that fall into the other two categories to avoid wasting time.

Using to-do lists can further streamline your productivity. Start each day by creating a list of tasks you want to accomplish, prioritizing them by importance. Break larger tasks into smaller, actionable steps, and check them off as you complete them to build momentum and a sense of achievement. Review your progress at the end of the day to identify what worked and plan for the next.

Lastly, build regular breaks into your schedule to recharge and avoid burnout. Even a quick 5-minute pause can refresh your focus and maintain your productivity throughout the day. By combining prioritization, focused work, and structured planning, you can achieve your goals more effectively and efficiently.`,
      stars: 2,
    },
  ],
  noteTaking: [
    {
      title: "The easy method",
      description: `Use the Cornell method to structure your notes effectively. Divide your page into three sections: a narrow left column for cues or keywords, a larger right column for detailed notes, and a bottom section for a summary. During class or while studying, jot down main ideas and details in the notes section, while leaving space to add key questions or prompts in the cues section later. Afterward, summarize the key points in your own words at the bottom of the page to reinforce your understanding.`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `The best method however is to take your primary, detailed notes on your computer for better organization and flexibility. Use KnowNotes, a student favorite for note-taking, to enhance your learning experience. With KnowNotes, you can record lectures directly, upload YouTube videos to annotate and take notes alongside, and create practice tests and flashcards for effective review. This all-in-one platform ensures that your notes are not only well-organized but also actionable for deeper understanding and retention.

Then for memorization, transfer key concepts from your digital notes into handwritten summaries. Handwriting helps engage your brain differently, improving memory retention. For example, after using KnowNotes to create flashcards or practice tests, rewrite essential points by hand to reinforce the material.`,
      stars: 2,
    },
  ],
  timeManagement: [
    {
      title: "The easy method",
      description: `If you’re looking for a quick and easy way to master time management you’re using the wrong app. There simply is none - however here is a simple format you can use for your upcoming tests:

| Type of Eval   | Time per Session    | Sessions per Week or Total Duration                     |
|----------------|---------------------|--------------------------------------------------------|
| **Quiz**       | 1–2h/session        | 2–3 sessions/week                                      |
| **Chapter Test** | 3–4 hours/session  | 3–4 sessions/week                                      |
| **Midterm Exam** | 4–6h/session       | 5 sessions over 2–3 weeks                              |
| **Final Exam** | 6–8h/session        | 6 sessions over 3 weeks                                |
| **Project**    | 2–3h/session        | 2–3 sessions/week starting 3 weeks in advance          |
| **Paper/Essays** | 2–3h/session      | 3–4 sessions/week starting 2–3 weeks in advance        |

**Note:**  
This is a personal process, so take the time you need to feel confident before the test. 😊`,
      stars: 1,
    },
    {
      title: "The best method",
      description: `Use time-blocking to assign specific time slots for each task in your day. Start by identifying your priorities and schedule the most important or challenging tasks during your peak productivity hours. Break your day into focused work periods and include time for breaks to recharge. For example, dedicate 9:00–10:30 AM to studying, 10:30–10:45 AM for a quick break, and 10:45–11:30 AM for reviewing notes.

To make time management even easier which 76% of Harvard students agreed with which is, the use of scheduling apps. Our frontrunner is Solace which is designed specifically for students. Solace combines to-do lists, time-blocking features, and reminders all in one place, helping you stay organized and on track. By planning your day within Solace, you can visually map out your tasks, track your progress, and ensure you're making the most of your time without missing anything important. Over time, this structured approach will improve your productivity and help you achieve your goals."
      `,
      stars: 2,
    },
  ],
} satisfies Record<
  keyof Stats,
  {
    title: string;
    description: string;
    stars: number;
    link?: string;
  }[]
>;

export async function getHighestPriorities(): Promise<
  {
    stat: keyof Stats;
    title: string;
  }[]
> {
  const stats = await getStats();
  if (!stats) return [];

  //   Sort stats from lowest to highest.
  const sortedStats = Object.entries(stats).sort((a, b) => a[1] - b[1]);
  return sortedStats.slice(0, 3).map(([key]) => ({
    stat: key as keyof Stats,
    title: priorities[key as keyof Stats],
  }));
}
