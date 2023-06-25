export interface PolicyPattern {
  subject?: string;

  action?: string;
  object?: string;
}

export interface ControlOptions {
  sep?: string;
  strict?: boolean;
}

export interface TimeOptions {
  currentDate?: Date;
  tz?: string;
}
