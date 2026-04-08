/**
 * Generate a new VAPID keypair for Web Push.
 *
 * Run: npm run vapid:generate
 *
 * Copy the output into .env.local:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (same value as VAPID_PUBLIC_KEY)
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
