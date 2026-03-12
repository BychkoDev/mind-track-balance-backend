export class SendWeeklyReportEvent {
  to: string;
  name: string;
  subject: string;
  summaryText: string;
  weekStart: string;
  weekEnd: string;
  pdfAttachment: string; // base64
}
