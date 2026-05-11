const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("✓ Email service ready");
  }
});

// POST route for form submission
app.post("/api/submit-form", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      intent,
      type,
      bhk,
      budget,
      location,
      size,
      notes,
    } = req.body;

    // Validate required fields
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Build email body
    const emailBody = `
New Property Enquiry from Website

---

Name: ${name || "N/A"}
Phone: ${phone}
Email: ${email || "N/A"}

---

PROPERTY REQUIREMENTS:
Intent: ${intent || "N/A"}
Property Type: ${type || "N/A"}
BHK Preference: ${Array.isArray(bhk) && bhk.length ? bhk.join(", ") : "N/A"}
Budget: ${budget || "N/A"}
Size: ${size || "N/A"}
Preferred Location: ${location || "N/A"}

---

Additional Notes:
${notes || "None"}

---

This enquiry was submitted via the website contact form.
    `.trim();

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "archanaproperty1@gmail.com",
      subject: `New property enquiry from ${name || "website visitor"}`,
      text: emailBody,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Optionally send confirmation email to user
    if (email) {
      const confirmationEmail = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank you for your enquiry - Archana Property Consultants",
        text: `Dear ${name},\n\nThank you for submitting your property requirements. Our team will review your enquiry and get in touch with you shortly at ${phone}.\n\nBest regards,\nArchana Property Consultants Team`,
      };
      await transporter.sendMail(confirmationEmail);
    }

    res.json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error("Form submission error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error submitting form. Please try again.",
      });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
