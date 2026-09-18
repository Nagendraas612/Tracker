import { sendTestNotification, sendThresholdNotification } from "../services/notificationService";

async function main() {
  const topic = process.argv[2] || "sanjay-sih-alert-7x92k4";
  console.log("==========================================");
  console.log(`🧪 Testing ntfy Notification Service (Topic: ${topic})`);
  console.log("==========================================");

  console.log("1. Sending test verification message...");
  const testRes = await sendTestNotification(topic);
  console.log("Result:", testRes);

  console.log("\n2. Sending simulated threshold alert message...");
  const alertRes = await sendThresholdNotification(
    {
      psId: "SIH26171",
      target: 50,
      maximumSubmissions: 500,
      title: "On-device Visual Perception for Light-weight Browser Agents",
    },
    topic,
    50
  );
  console.log("Result:", alertRes);
  console.log("==========================================");
}

main().catch(console.error);
