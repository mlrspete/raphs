export type WaitlistApiSuccess = {
  success: true;
  leadId: string | null;
};

export type WaitlistApiError = {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export type WaitlistApiResponse = WaitlistApiSuccess | WaitlistApiError;
