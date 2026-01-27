import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure Brevo client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
//console.log("BREVO KEY:", process.env.BREVO_API_KEY ? "LOADED" : "MISSING");
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * sendEmail(to, subject, text)
 * same format as your old Gmail mailer
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const emailData = {
      sender: {
        name: "Jayapriya",
        email: process.env.PASS_MAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      textContent: text,
      htmlContent: html,
    };

    await tranEmailApi.sendTransacEmail(emailData);
    //console.log("Email sent successfully via Brevo");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
