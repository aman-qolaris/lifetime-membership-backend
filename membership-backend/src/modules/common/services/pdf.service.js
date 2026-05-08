import PDFDocument from "pdfkit";
import sharp from "sharp";

class PdfService {
  async generateIdCardBuffer(memberData) {
    // FIXED: Removed the redundant outer try-catch block.
    // Any errors will now automatically propagate up the async chain.
    const doc = new PDFDocument({
      size: [243, 153],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));

    const pdfBufferPromise = new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject); // Added error listener to safely reject if PDFKit fails
    });

    // 1. Background
    doc.rect(0, 0, 243, 153).fill("#f8f9fa");

    // 2. Header
    doc
      .fillColor("#003366")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Maharashtra Mandal Raipur", 0, 12, {
        align: "center",
        width: 243,
      });

    doc.fillColor("#d9534f").fontSize(7).text("LIFETIME MEMBER", 0, 25, {
      align: "center",
      width: 243,
    });

    doc
      .moveTo(10, 35)
      .lineTo(233, 35)
      .lineWidth(1)
      .strokeColor("#cccccc")
      .stroke();

    // 3. Photo
    const photoUrl = memberData.photoUrl ?? memberData.photo_url;

    if (photoUrl) {
      try {
        let fullPhotoUrl = photoUrl;

        if (!fullPhotoUrl.startsWith("http")) {
          const minioEndpoint = process.env.MINIO_ENDPOINT || "127.0.0.1";
          const minioPort = process.env.MINIO_PORT || "9000";
          const protocol =
            process.env.MINIO_USE_SSL === "true" ? "https" : "http";

          fullPhotoUrl = `${protocol}://${minioEndpoint}:${minioPort}${fullPhotoUrl}`;
        }

        const response = await fetch(fullPhotoUrl);
        const arrayBuffer = await response.arrayBuffer();
        let imageBuffer = Buffer.from(arrayBuffer);

        const contentType = response.headers.get("content-type") || "";
        const looksLikeWebp =
          contentType.includes("image/webp") ||
          fullPhotoUrl.toLowerCase().includes(".webp");

        if (looksLikeWebp) {
          imageBuffer = await sharp(imageBuffer).png().toBuffer();
        }

        doc.image(imageBuffer, 10, 45, { width: 55, height: 70 });

        doc.rect(10, 45, 55, 70).lineWidth(0.5).strokeColor("#999999").stroke();
      } catch (error_) {
        console.error("Failed to load profile photo for PDF:", error_.message);

        doc.rect(10, 45, 55, 70).fillAndStroke("#eeeeee", "#cccccc");

        doc.fillColor("#999999").fontSize(6).text("NO PHOTO", 10, 75, {
          width: 55,
          align: "center",
        });
      }
    }

    // 4. Details
    const startX = 75;
    let currentY = 45;

    doc
      .fillColor("#333333")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(memberData.name, startX, currentY);

    currentY += 13;

    doc
      .fontSize(7)
      .font("Helvetica")
      .text(`Reg No: `, startX, currentY, { continued: true })
      .font("Helvetica-Bold")
      .text(memberData.registrationNumber);

    currentY += 10;

    doc
      .font("Helvetica")
      .text(`Mobile: `, startX, currentY, { continued: true })
      .font("Helvetica-Bold")
      .text(memberData.mobileNumber);

    currentY += 10;

    doc
      .font("Helvetica")
      .text(`Email: `, startX, currentY, { continued: true })
      .font("Helvetica-Bold")
      .text(memberData.email);

    currentY += 10;

    doc
      .font("Helvetica")
      .text(`Address: ${memberData.address}`, startX, currentY, {
        width: 158,
        lineGap: 1,
        height: 30,
        ellipsis: true,
      });

    doc.end();

    return await pdfBufferPromise;
  }
}

export default new PdfService();
