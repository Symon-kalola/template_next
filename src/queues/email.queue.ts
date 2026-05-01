import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env";
import { sendMail } from "../config/mailer";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const emailQueue = new Queue<EmailJobData>("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    await sendMail(job.data);
    console.log(`[EmailQueue] Sent "${job.data.subject}" → ${job.data.to}`);
  },
  { connection },
);

emailWorker.on("completed", (job) => console.log(`[EmailQueue] Job ${job.id} completed`));
emailWorker.on("failed", (job, err) =>
  console.error(`[EmailQueue] Job ${job?.id} failed: ${err.message}`),
);

export const addEmailJob = (data: EmailJobData) => emailQueue.add("send-email", data);
