import { prisma } from "../prisma";
import { getContactNotifyEmail } from "../env";
import { sendEmail } from "./index";
import { customerAckEmail, staffNotifyEmail, type ContactEmailData } from "./templates/contact";
import type { ContactTopic } from "../contact-admin";

type ContactEnquiryRow = {
	id: string;
	fullName: string;
	email: string;
	phone: string | null;
	company: string | null;
	topic: ContactTopic;
	message: string;
	createdAt: Date;
};

export async function sendContactEnquiryEmails(enquiry: ContactEnquiryRow): Promise<void> {
	const data: ContactEmailData = {
		id: enquiry.id,
		fullName: enquiry.fullName,
		email: enquiry.email,
		phone: enquiry.phone,
		company: enquiry.company,
		topic: enquiry.topic,
		message: enquiry.message,
		createdAt: enquiry.createdAt,
	};

	const ack = customerAckEmail(data);
	const ackResult = await sendEmail({
		to: enquiry.email,
		subject: ack.subject,
		html: ack.html,
		text: ack.text,
	});

	const notify = staffNotifyEmail(data);
	const notifyResult = await sendEmail({
		to: getContactNotifyEmail(),
		subject: notify.subject,
		html: notify.html,
		text: notify.text,
	});

	await prisma.contactEnquiry.update({
		where: { id: enquiry.id },
		data: {
			customerAckStatus: ackResult.status,
			staffNotifyStatus: notifyResult.status,
		},
	});
}
