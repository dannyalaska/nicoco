import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  WebhookBody,
  verifyWebhookSignature,
  webhookToDeliveryEvent,
} from "./webhook";

describe("verifyWebhookSignature", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ destination: { lat: 1, lon: 2 } });
  const valid =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a correctly signed payload", () => {
    expect(
      verifyWebhookSignature({ rawBody: body, signatureHeader: valid, secret }),
    ).toBe(true);
  });

  it("rejects when signature header is missing", () => {
    expect(
      verifyWebhookSignature({ rawBody: body, signatureHeader: null, secret }),
    ).toBe(false);
  });

  it("rejects when the prefix is wrong", () => {
    expect(
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: valid.replace("sha256=", "sha1="),
        secret,
      }),
    ).toBe(false);
  });

  it("rejects when the body has been tampered with", () => {
    expect(
      verifyWebhookSignature({
        rawBody: body + " ",
        signatureHeader: valid,
        secret,
      }),
    ).toBe(false);
  });

  it("rejects when the secret is different", () => {
    expect(
      verifyWebhookSignature({
        rawBody: body,
        signatureHeader: valid,
        secret: "wrong-secret",
      }),
    ).toBe(false);
  });
});

describe("WebhookBody + webhookToDeliveryEvent", () => {
  it("accepts the nested destination shape", () => {
    const parsed = WebhookBody.parse({
      externalId: "abc",
      destination: { lat: 37.76, lon: -122.42, address: "Foo" },
      dispatchedAt: "2024-01-01T00:00:00.000Z",
    });
    const evt = webhookToDeliveryEvent("r1", parsed);
    expect(evt.retailerId).toBe("r1");
    expect(evt.externalId).toBe("abc");
    expect(evt.destination.lat).toBe(37.76);
    expect(evt.destination.lon).toBe(-122.42);
    expect(evt.sourceAdapter).toBe("webhook");
  });

  it("accepts the flat destLat/destLon shape", () => {
    const parsed = WebhookBody.parse({
      destLat: 37.76,
      destLon: -122.42,
      destAddress: "Bar",
    });
    const evt = webhookToDeliveryEvent("r1", parsed);
    expect(evt.destination.lat).toBe(37.76);
    expect(evt.destination.address).toBe("Bar");
  });

  it("rejects payloads missing destination coordinates", () => {
    expect(() => WebhookBody.parse({ externalId: "x" })).toThrow();
  });

  it("rejects out-of-range coordinates", () => {
    expect(() =>
      WebhookBody.parse({ destLat: 91, destLon: 0 }),
    ).toThrow();
  });
});
