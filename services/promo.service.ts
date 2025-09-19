import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  limit as qlimit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { randomCode } from "./coupon.service";
import { sendNotificationToAllUsers } from "./notification.service";

export async function createGlobalPromo(title: string, imageUrl?: string) {
  if (!title?.trim()) throw new Error("Titre requis");

  // Récupérer tous les utilisateurs
  const usersSnap = await getDocs(query(collection(db, "users")));
  const users = usersSnap.docs;
  const now = serverTimestamp();

  // Image par défaut : icône de l'app
  const defaultImageUrl = "assets/images/icon.png";
  const finalImageUrl = imageUrl || defaultImageUrl;

  console.log(`Création de promo pour ${users.length} utilisateurs...`);

  // Créer les coupons par lots de 500 (limite Firestore)
  const COUPON_CHUNK = 500;
  let created = 0;

  for (let i = 0; i < users.length; i += COUPON_CHUNK) {
    const batch = writeBatch(db);
    const slice = users.slice(i, i + COUPON_CHUNK);

    slice.forEach((u) => {
      const id = doc(collection(db, "coupons")).id;
      batch.set(doc(db, "coupons", id), {
        id,
        uid: u.id,
        title,
        type: "promo",
        code: randomCode("PRM"),
        status: "active",
        imageUrl: finalImageUrl,
        createdAt: now,
      });
    });

    await batch.commit();
    created += slice.length;
    console.log(`Coupons créés: ${created}/${users.length}`);
  }

  console.log(`✅ Tous les coupons créés (${created} total)`);

  // Envoyer les notifications push par lots
  try {
    console.log("Envoi des notifications push...");
    const notificationResult = await sendNotificationToAllUsers(
      "🎉 Nouvelle promo disponible !",
      title,
      {
        type: "promo",
        title,
        action: "open_app",
      }
    );

    console.log(
      `📱 Notifications envoyées: ${notificationResult.sent} succès, ${notificationResult.failed} échecs`
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications:", error);
    // Ne pas faire échouer la création de promo si les notifications échouent
  }

  return {
    created,
    usersCount: users.length,
    notificationsSent: true,
  };
}

export async function listRecentActivePromosGlobal(take = 20) {
  const snap = await getDocs(
    query(
      collection(db, "coupons"),
      where("type", "==", "promo"),
      where("status", "==", "active"),
      qlimit(take)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function expireSomeGlobalPromos(limitCount = 400) {
  const snap = await getDocs(
    query(
      collection(db, "coupons"),
      where("type", "==", "promo"),
      where("status", "==", "active"),
      qlimit(limitCount)
    )
  );
  if (snap.empty) return { updated: 0 };
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.set(d.ref, { status: "expired" }, { merge: true });
  });
  await batch.commit();
  return { updated: snap.size };
}
