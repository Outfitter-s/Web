import { env } from '$env/dynamic/private';
import config from '$conf';
import { createTransport } from 'nodemailer';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

const auth =
  env.SMTP_USER && env.SMTP_PASSWORD
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      }
    : undefined;

const transporter = createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  auth,
  secure: false,
});

export async function getEmailBody(name: string) {
  const templatesDir = join(PROJECT_ROOT, '/transactional/emailTemplates');
  const templates = await readdir(templatesDir);
  const filename = name + '.html';
  if (!templates.includes(filename)) {
    throw new Error(`Email template ${name} not found`);
  }
  const body = await readFile(join(templatesDir, filename), 'utf-8');
  return body;
}

export function replacePlaceholders(body: string, placeholders: Record<string, string>) {
  return Object.entries(placeholders).reduce((acc, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return acc.replace(regex, value);
  }, body);
}

export async function sendMail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  if (!to || !subject || !body) {
    return { success: false, message: 'Missing required fields' };
  }

  await transporter.sendMail({
    from: `no-reply@${config.project_name}.com`,
    to,
    subject,
    html: body,
  });

  return { success: true };
}
