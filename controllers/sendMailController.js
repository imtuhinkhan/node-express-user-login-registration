import mailgun from "mailgun-js";
import asyncHandler from "express-async-handler";

export const sendEmail = async (from, to, subject, body) => {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = { from, to, subject, html: body };

  try {
    await mg.messages().send(data);
    return true;
  } catch (error) {
    if (error.statusCode == 403) {
      return false;
    }
    return false;
  }
};

const mealPlanEmail = asyncHandler(async (req, res) => {
  try {
    const FROM_EMAIL = "Crafted Meals <support@realtor.buildyourai.consulting>";
    await sendEmail(
      FROM_EMAIL,
      req.body.toEmail,
      req.body.subject,
      req.body.messageBody
    );
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(405).json({ message: "Something went wrong" });
  }
});

async function sendMailToNewUser(frontEndUrl, toEmail) {
  const FROM_EMAIL = "Real Estate AI <registration@realtor.buildyourai.consulting>";
  const trainerEmailBody = `
      <h1>Account Verification</h1>
      <p>Thank you for registering on Real Estate AI. Please click the following link to verify your account:</p>
      <a href="${frontEndUrl}">Verify Account</a>
    `;

  await sendEmail(
    FROM_EMAIL,
    toEmail,
    "Account Verification",
    trainerEmailBody
  );
}
async function sendMailOnPasswordForget(frontEndUrl, toEmail) {
  const FROM_EMAIL = "Real Estate AI <support@realtor.buildyourai.consulting>";
  const trainerEmailBody = `
      <h2>Account Support on forget password request</h2>
      <p>Real Estate AI support team to rescue, Please click the following link to reset your password:</p>
      <a href="${frontEndUrl}">Reset Password</a>
      <p><strong>Note:</strong> We got a reset password request, if it was not you please let us know.</p>
    `;

  await sendEmail(FROM_EMAIL, toEmail, "Reset Password", trainerEmailBody);
}

async function sendMailToSuperUsers(userInfo, toEmail) {
  const FROM_EMAIL = "Real Estate AI <registration@realtor.buildyourai.consulting>";
  const trainerEmailBody = `
      <h1>New User Registration</h1>
      <p>A new user has registered:</p>
      <p><strong>Name:</strong> ${userInfo.firstName} ${userInfo.lastName}</p>
      <p><strong>Email:</strong> ${userInfo.email}</p>
      <p><strong>Organization:</strong> ${userInfo.organizationName}</p>
    `;

  await sendEmail(
    FROM_EMAIL,
    toEmail,
    "New user has registered on Real Estate AI",
    trainerEmailBody
  );
}
export {
  mealPlanEmail,
  sendMailToSuperUsers,
  sendMailOnPasswordForget,
  sendMailToNewUser,
};
