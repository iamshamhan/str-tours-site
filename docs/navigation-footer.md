# Phase 4B — navigation and footer

The owner can add, edit, hide, delete and reorder links at /admin/navigation and
/admin/footer. Navigation supports one dropdown level. Footer links share a group
by matching group names; the first occurrence determines group order. Footer
heading, body, copyright and legal text have a separate publication checkbox.

Changes are staged until Save changes. Discard changes restores the last saved
form. Removing a navigation parent stages its children for deletion too. Saved
deletions are permanent; hide an item if it may be needed again. Use one editor tab
at a time: concurrent edits to the same row are last-save-wins.

The migration 20261017141324_navigation_footer_editors.sql is applied to str-tours
and matches the remote ledger. It adds nav_items.parent_id, a parent/order index,
a deferred one-level tree constraint, parent-aware SELECT policies, and the
save_site_links RPC. The RPC is SECURITY INVOKER, checks private.is_admin(), and
runs all writes atomically under the caller's RLS. Anonymous callers have no RPC
execute permission. A private helper returns only published root navigation IDs
to avoid recursive RLS; it does not expose admin membership.

The application authorizes every editor read and mutation on the server. Public
reads use the cookie-free publishable-key client, published filters, no-store,
eight-second timeouts and validation. Empty/error results render no invented
brand copy. Existing seed data remains available for review.

Public navigation has a sticky translucent blurred header, native expandable
dropdowns and a mobile menu that closes with Escape. Fonts, colours and radii
inherit published settings. The WhatsApp button requires a valid international
number in published site-config settings and a saved navigation-ui button label.
Menu, close and WhatsApp labels are editable in Navigation. No message is sent
when testing the link; it only points to wa.me.

Links accept /paths, #anchors, HTTPS, mailto and tel. Unsafe schemes, control
characters, protocol-relative URLs, URL credentials and backslash tricks are
rejected. Text is escaped by React. New tabs use noopener noreferrer.

## Check it yourself

1. Run npm run dev, sign in, and open /admin/navigation.
2. Add a label and link. Invalid links such as javascript:alert(1) must be rejected.
3. Drag a handle onto another card, or use Move up/down, then Save changes and
   reload. Confirm the order persists.
4. Choose a top-level dropdown parent for a child. Mark both Visible and save.
   Open / and expand the parent. Check keyboard activation and Escape, then test
   the mobile Menu button at a narrow width.
5. Hide the parent and save. Neither it nor its child should appear publicly.
6. Delete an unused test link, then Discard to verify staged deletion can be undone.
   Save deletion only when you intend permanent removal.
7. At /admin/footer, add links to groups, reorder, edit text and copyright, and
   publish reviewed text. Link visibility is independent of text publication.
8. Publish verified site settings with an international WhatsApp number, and save
   the Navigation control labels. Inspect the floating button's wa.me destination.
9. Hide all links/text and unpublish site settings: / should have no brand fallback.
10. Log out. Direct visits to both editors must redirect to /admin/login.

## Verification record

- Lint, TypeScript checking and the production build passed after the pointer/hydration
  refinement.
- Eleven automated tests cover auth throttling, settings, unsafe URL rejection,
  dropdown cycles/orphans/deeper nesting, group requirements and WhatsApp numbers.
- Parent-aware RLS and non-admin RPC denial were verified with rolled-back
  synthetic links. The committed fixture now explicitly refuses any database
  containing an admin; future runs require a fresh development database.
- Browser: unsafe links rejected; add and staged delete/discard worked; Move
  up/down worked; dropdown configuration saved with the real admin session and
  persisted across restart; public dropdown and new-tab rel/target were verified.
- Mobile menu opened and Escape closed it at 390px. Hiding the parent removed the
  entire dropdown publicly. Original navigation visibility/parent/new-tab values
  were restored through the admin session.
- Eleven logged-out routes passed redirect/no-store/noindex checks, including
  Footer. The footer editor loaded the original draft groups and copy.
- React server-rendering tests verify footer groups, copy, safe new-tab attributes,
  escaped text and the empty fallback without changing real publication state.
- The live session ended during further testing. The owner signed in again, but
  browser automation then timed out repeatedly. On resuming, the browser was back
  at the login page. Final pointer dragging and footer
  save/publish remain manual checks. WhatsApp number formatting is unit-tested;
  no live WhatsApp navigation or external message has been sent.
- Supabase's security advisor reported no table-policy finding, but did report
  leaked-password protection disabled. See
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

Commands: npm run lint; npm run typecheck; npm run build;
node --test tests/*.test.mjs; node scripts/check-admin-http.mjs http://localhost:3000.
