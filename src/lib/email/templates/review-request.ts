import { getSiteUrl } from "../../env";

type ReviewRequestParams = {
	customerName: string;
	productTitle: string;
	productSlug: string;
};

export function reviewRequestTemplate(params: ReviewRequestParams): {
	subject: string;
	html: string;
	text: string;
} {
	const { customerName, productTitle, productSlug } = params;
	const siteUrl = getSiteUrl();
	const reviewUrl = `${siteUrl}/shop/${productSlug}#reviews`;

	const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="font-size:20px;color:#101c27;">How's your experience with ${productTitle}?</h1>
      <p>Hi ${customerName},</p>
      <p>
        You recently purchased <strong>${productTitle}</strong> from Monarch. We'd love to hear what you think.
        Reviews help other community members know what to expect and take only a minute to write.
      </p>
      <p style="margin-top:24px;">
        <a href="${reviewUrl}" style="background:#355a7a;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">
          Leave a Review
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        If you have any issues with your purchase, please contact us via the 
        <a href="${siteUrl}/contact">support page</a> instead of leaving a review.
      </p>
    </div>
  `;

	const text = `How's your experience with ${productTitle}?

Hi ${customerName},

You recently purchased ${productTitle} from Monarch. We'd love to hear what you think.
Leave a review here: ${reviewUrl}

If you have any issues with your purchase, please contact us: ${siteUrl}/contact
`;

	return {
		subject: `Share your thoughts on ${productTitle}`,
		html,
		text,
	};
}
