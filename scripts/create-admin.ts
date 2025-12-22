import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  ),
});

const db = admin.firestore();
const auth = admin.auth();

const createAdmin = async () => {
  const email = "admin@ayraa.com";
  const password = "Admin@123";

  try {
    let user;

    try {
      user = await auth.getUserByEmail(email);
      console.log("ℹ️ Admin already exists");
    } catch {
      user = await auth.createUser({ email, password });
      console.log("✅ Admin created in Auth");
    }

    await db.collection("users").doc(user.uid).set(
      {
        email,
        role: "admin",
        name: "AYRAA Admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Admin role saved in Firestore");
    console.log("🆔 UID:", user.uid);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

createAdmin();
