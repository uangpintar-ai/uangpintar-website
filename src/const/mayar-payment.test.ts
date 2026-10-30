import assert from "node:assert/strict";
import test from "node:test";
import { parseMayarPaymentDetail } from "./mayar-payment";

test("parses QRIS payment detail", () => {
  const detail = parseMayarPaymentDetail({
    type: "QR_CODE",
    qr_code: { channel_properties: { qr_string: "000201010212..." } },
  });

  assert.deepEqual(detail, { kind: "qris", qrString: "000201010212..." });
});

test("parses virtual account payment detail", () => {
  const detail = parseMayarPaymentDetail({
    type: "VIRTUAL_ACCOUNT",
    virtual_account: {
      channel_code: "BNI",
      channel_properties: {
        virtual_account_number: "8808862069876966",
        customer_name: "Uang Pintar",
      },
    },
  });

  assert.deepEqual(detail, {
    kind: "virtual_account",
    bank: "BNI",
    accountNumber: "8808862069876966",
    accountName: "Uang Pintar",
  });
});

test("parses e-wallet links and QR, and rejects unsafe URLs", () => {
  const detail = parseMayarPaymentDetail({
    type: "EWALLET",
    ewallet: { channel_code: "SHOPEEPAY" },
    actions: [
      {
        url_type: "DEEPLINK",
        url: "https://app.shopeepay.co.id/pay",
      },
      {
        url: "javascript:alert(1)",
      },
      {
        qr_code: "000201010212...",
      },
    ],
  });

  assert.deepEqual(detail, {
    kind: "ewallet",
    channel: "SHOPEEPAY",
    links: [{ kind: "deeplink", url: "https://app.shopeepay.co.id/pay" }],
    qrString: "000201010212...",
  });
});

test("returns null for an unknown shape", () => {
  assert.equal(parseMayarPaymentDetail({ type: "CARD" }), null);
  assert.equal(parseMayarPaymentDetail(null), null);
});
