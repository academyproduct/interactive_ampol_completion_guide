# Implementation Plan: Email Address Input

## Overview

Add an email address input field to the completion-guide form in `client/pages/Index.tsx`, with localStorage persistence, soft/hard validation, xAPI actor integration, and a Vite dev server fix. All changes are client-side TypeScript/React.

## Tasks

- [x] 1. Add email state, validation helper, and localStorage persistence
  - [x] 1.1 Add `emailAddress` and `emailTouched` state variables to the `Index` component
    - Add `const [emailAddress, setEmailAddress] = useState<string>("")` and `const [emailTouched, setEmailTouched] = useState(false)`
    - Add inline `isValidEmail` helper function using the regex from the design: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
    - _Requirements: 1.1, 5.1, 5.2_

  - [x] 1.2 Persist `emailAddress` in localStorage via existing save/load functions
    - Include `emailAddress` in the state object written by `saveToLocalStorage`
    - Read `state.emailAddress || ""` in `loadFromLocalStorage` and call `setEmailAddress`
    - Add `emailAddress` to the `useEffect` dependency array that triggers `saveToLocalStorage`
    - _Requirements: 3.1, 3.2, 3.3, 7.4_

  - [x] 1.3 Write property test for email localStorage round-trip (Property 1)
    - **Property 1: Email localStorage Round-Trip**
    - Generate arbitrary strings via `fc.string()`, save to localStorage state, load back, assert equality
    - **Validates: Requirements 3.1, 3.2, 7.4**

- [x] 2. Render email input field with responsive layout
  - [x] 2.1 Restructure the completion date wrapper for side-by-side layout
    - Replace the `max-w-[262px]` wrapper with a `flex flex-col sm:flex-row items-start justify-center gap-4 w-full max-w-[600px]` container
    - Move the existing completion date input into its own `w-full sm:w-auto flex flex-col gap-1.5` child div
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Add the email input field beside the completion date input
    - Add a second `w-full sm:w-auto flex flex-col gap-1.5` child div containing the email label and input
    - Use `<label htmlFor="email-input">` with text "Enter your email address:" and matching label styles (`text-center text-black text-base font-bold font-lato`)
    - Use `<input id="email-input" type="email" autoComplete="email" placeholder="name@example.com">` with matching input styles (`w-full px-4 py-3 text-center border-[1.4px] border-black/30 rounded text-lg`)
    - Wire `value={emailAddress}`, `onChange` to `setEmailAddress`, and `onBlur` to set `emailTouched(true)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2_

  - [x] 2.3 Add inline soft nudge and validation error messages below the email input
    - Show amber soft nudge text "Providing an email is recommended." when `emailTouched && emailAddress.trim() === ""`
    - Show red validation error text "Please enter a valid email address." when `emailAddress.trim() !== "" && !isValidEmail(emailAddress.trim())`
    - Use `text-sm text-amber-600 font-lato` for nudge and `text-sm text-red-600 font-lato` for error
    - _Requirements: 4.2, 4.3, 5.3, 8.3_

- [x] 3. Update handleSubmit with email validation logic
  - [x] 3.1 Add email validation gate in `handleSubmit`
    - After existing date/day checks and before scheduling logic, add: if `emailAddress.trim() !== ""` and `!isValidEmail(emailAddress.trim())`, show validation error and return early
    - Set `emailTouched` to `true` on submit so nudge/error messages appear
    - When email is blank, allow submission to proceed (non-blocking nudge)
    - _Requirements: 4.1, 5.1, 5.2_

  - [x] 3.2 Write property test for email validation correctness (Property 2)
    - **Property 2: Email Validation Correctness**
    - Generate arbitrary non-empty strings via `fc.string({ minLength: 1 })`, verify `isValidEmail` returns `true` only for strings matching the expected pattern
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. Integrate email with xAPI actor identification
  - [x] 4.1 Add `setActorEmail` export and update `getActor` in `client/lib/xapi.ts`
    - Add module-level `let _actorEmail = ""` and `export function setActorEmail(email: string) { _actorEmail = email; }`
    - Update `getActor()` to return `{ mbox: "mailto:${_actorEmail}" }` when `_actorEmail` is non-empty, otherwise fall back to existing anonymous account-based actor
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Sync email state to xAPI module via useEffect in `Index.tsx`
    - Import `setActorEmail` from `@/lib/xapi`
    - Add `useEffect(() => { setActorEmail(emailAddress.trim()); }, [emailAddress]);`
    - _Requirements: 7.3_

  - [x] 4.3 Write property test for scheduler independence from email (Property 3)
    - **Property 3: Scheduler Independence from Email**
    - Generate two arbitrary email strings and fixed scheduling inputs, run `greedyScheduleTasks` for both, assert deep equality of output
    - **Validates: Requirements 6.1**

- [x] 5. Fix Vite dev server file access
  - [x] 5.1 Update `server.fs.allow` in `vite.config.ts` to include the project root
    - Add `path.resolve(__dirname)` to the `server.fs.allow` array so that `index.html` at the project root can be served during local development
    - _Requirements: 9.1_

- [x] 6. Checkpoint - Verify all changes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses TypeScript/React throughout — no language selection needed
- Property tests use Vitest + fast-check (`fc`) as specified in the design
- No backend or new API changes are required
