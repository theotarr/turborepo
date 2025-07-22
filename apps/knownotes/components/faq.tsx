import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What does KnowNotes do?",
    answer:
      "KnowNotes transcribes your lectures and turns it into organized notes, flashcards, and quizzes. KnowNotes helps you improve your grades by using AI that doesn't break your school's honor code. You can also upload audio recordings or Youtube videos as lectures!",
  },
  {
    question: "Is this allowed at my school?",
    answer:
      "Yes! As long as your professor is cool with you transcribing the class. KnowNotes helps you actually learn course material at a faster pace. KnowNotes doesn't break your school's honor code.",
  },
  {
    question: "Do we store your lecture recordings?",
    answer:
      "No! We never save audio recordings and we transfer all data over HTTPS. We take your privacy very seriously.",
  },
  {
    question: "Can I promote KnowNotes?",
    answer:
      "Yes! Feel free to share KnowNotes with your friends, family, and classmates!",
  },
];

export function FaqArray() {
  return (
    <Accordion
      type="single"
      collapsible={true}
      className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-4"
    >
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="col-span-1">
          <AccordionTrigger className="text-lg font-medium text-secondary-foreground">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
