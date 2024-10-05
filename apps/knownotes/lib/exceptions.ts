export class RequiresProPlanError extends Error {
  constructor(message = "This action requires a pro plan") {
    super(message);
  }
}

export class ChatMessageRateLimitError extends Error {
  constructor(message = "You have sent too many messages this month") {
    super(message);
  }
}

export class LectureRateLimitError extends Error {
  constructor(message = "You have created too many lectures this month") {
    super(message);
  }
}
