# Production Domain Switch

Target production domain:

```text
https://overdriveaccountingservices.com/
```

Current demo domain:

```text
https://demo.cyborgjedi.com/
```

When the production switch is approved:

1. Add `overdriveaccountingservices.com` as a custom domain for the Worker.
2. Point the domain DNS through Cloudflare and confirm the record is proxied.
3. Update `public/robots.txt` and `public/sitemap.xml` to the production hostname.
4. Update `public/llm.txt` and `public/humans.txt` website references.
5. Add the production hostname to the Turnstile widget and verify `TURNSTILE_SECRET_KEY` remains a Runtime Secret.
6. Verify the Resend sending domain and update `EMAIL_FROM` if needed.
7. Purge Cloudflare cache after deployment.
8. Test `/`, `/about`, `/insights`, `/faq`, `/admin`, the appointment form, D1/R2 documents, and the SecureFilePro client portal link.
9. Confirm private paths remain protected and `robots.txt` still disallows `/admin`, `/api/`, and any internal client route.
