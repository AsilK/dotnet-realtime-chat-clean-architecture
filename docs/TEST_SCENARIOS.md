# Test Scenarios

This checklist provides fast manual and E2E validation paths across UI, API, and SignalR workflows.

## Happy Path

1. Register -> Login -> Logout
   - Create a user via `/register`.
   - Verify automatic redirect to `/chat` and user badge visibility.
   - Click `Sign Out` and confirm redirect to `/login`.

2. Create Room -> Join Room -> Send Message
   - Create a room from `/chat`.
   - Select room and click `Join`.
   - Send a message and verify list rendering.

3. Edit/Delete Message
   - Edit your own message and save.
   - Delete the message and verify `[deleted]` marker.

4. Realtime typing/presence/read (2 sessions)
   - Open sessions A and B with different users.
   - Trigger typing in B and verify indicator in A.
   - Trigger read in B and verify read status update in A.

5. QA panel API/Hub invoke
   - Use `/qa` API Playground to call at least one endpoint.
   - Use Hub Playground to invoke at least one chat hub method.
   - Confirm event logs in Event Monitor.

## Failure Path

1. Invalid login
   - Attempt login with incorrect password.
   - Verify error message and no authenticated session.

2. Token refresh failure
   - Use invalid/expired refresh token on protected route.
   - Verify session clear and redirect to `/login`.

3. Rate limit behavior
   - Run auth burst test from `/qa` Rate/Load panel.
   - Verify 429 counts and summary reporting.

4. Hub disconnect
   - Force-close the hub session.
   - Verify UI state transitions to `disconnected` / `reconnecting`.

5. Invalid API payload
   - Send malformed JSON/body from API Playground.
   - Verify status code and error response body.

## Time Target

A new engineer should be able to run this checklist in 15-20 minutes to:

- boot the full environment
- confirm core workflows
- observe failure/rate-limit/retry behavior
