"use client";

import { cn } from "@/lib/utils";

import { Card } from "./ui/card";

const reviews = [
  {
    review:
      "I can't imagine life without KnowNotes. It's saves me hours taking notes and automates my studying.",
    author: "Theo Tarr",
    school: "Harvard University",
    rating: 5,
  },
  {
    review:
      "The chat with course feature is crazy. It pulls up relevant notes and answers questions based on the semester of classes.",
    author: "Alex Chen",
    school: "Stanford University",
    rating: 5,
  },
  {
    review:
      "It turns my Youtube binges into productive and interactive study sessions. It's a game-changer.",
    author: "Taylor Morgan",
    school: "Babson College",
    rating: 5,
  },
  {
    review:
      "I feel like I'm studying smarter, not harder. It's a must have for anyone who values efficiency.",
    author: "Jordan Patel",
    school: "Cornell University",
    rating: 5,
  },
  {
    review:
      "This AI saved my grades and so much of my time this semester. I can't imagine taking notes by hand anymore.",
    author: "Casey Rivers",
    school: "MIT",
    rating: 5,
  },
  {
    review:
      "The AI answers are tailored to each of my classes. It's like the AI knows exactly what I need to know.",
    author: "Avery Nguyen",
    school: "Duke University",
    rating: 5,
  },
];

function StarIcon(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[...Array(5).keys()].map((index) => (
        <StarIcon
          key={index}
          className={cn(
            "h-5 w-5",
            rating > index ? "fill-primary" : "fill-secondary",
          )}
        />
      ))}
    </div>
  );
}

function Review({
  review,
  author,
  rating,
  className,
  school,
  ...props
}: {
  review: string;
  author: string;
  rating: number;
  className?: string;
  school?: string;
}) {
  return (
    <Card className={cn("p-6", className)} {...props}>
      <blockquote className="text-secondary-foreground">
        <StarRating rating={rating} />
        <p className="mt-4 text-base leading-7">{review}</p>
      </blockquote>
      <figcaption className="mt-6 text-base font-medium text-secondary-foreground/80">
        {author}
      </figcaption>
      {school && (
        <p className="mt-1 text-sm text-secondary-foreground/60">{school}</p>
      )}
    </Card>
  );
}

export function ReviewGrid() {
  return (
    <div className="mx-auto flex flex-wrap items-center justify-center gap-8 px-4 sm:mt-6">
      {reviews.map((review, index) => {
        return <Review key={index} className="w-full max-w-96" {...review} />;
      })}
    </div>
  );
}
