---
phase: 03-content-creation
plan: 05
status: completed
gap_closure: true
executed: 2026-01-26
---

# Summary: Expand Stigma Language Detection

## Objective
Expanded stigma language policy to detect inflected forms (addicts, crazier, craziest) and cure language terms (fix, heal, repair, cure) when referring to people with mental health conditions.

## Changes Made

### File: `src/lib/governance/policies/stigma-language.ts`

**Problem:** User input "In 2026, addicts are more crazier than ever. We will fix you." passed validation without detecting violations.

**Root Cause:**
1. "addicts" (plural) not in STIGMA_TERMS (only "addict" singular)
2. "crazier" (comparative form) not in STIGMA_TERMS (only "crazy" base form)
3. "fix" (cure language) not in STIGMA_TERMS at all

**Why Word-Boundary Regex Requires Exact Matches:**
The validator uses `\b${term}\b` regex pattern which requires exact word matches. This means:
- "addict" won't catch "addicts"
- "crazy" won't catch "crazier" or "craziest"

### Terms Added (7 total)

#### 1. Substance Use Stigma - Plural Form
**Location:** Line 21 (after 'addict')
```typescript
'addicts', // plural form
```

#### 2. Mental Health Stigma - Inflected Forms
**Location:** Lines 42-43 (after 'crazy')
```typescript
'crazier', // comparative form
'craziest', // superlative form
```

#### 3. Cure Language Stigma - New Section
**Location:** Lines 100-106 (before "Eating disorder stigma")
```typescript
// Cure language stigma
// Alternative: "support", "help", "assist", "treat"
// Context: "fix/heal/cure" are stigmatizing when referring to people
'fix', // "we will fix you" implies person is broken
'heal', // "we will heal you" medicalizes identity
'repair', // "repair them" implies they are defective
'cure', // "cure the mentally ill" implies disease not condition
```

**Why These Terms Are Stigmatizing:**
- **Cure Language:** SAMHSA "Words Matter" guide explicitly warns against treatment language that implies people are broken/defective
- **Inflected Forms:** Common usage patterns that still carry stigmatizing connotations
- **Contextual Note:** These terms are stigmatizing when referring to people, not problems (e.g., "fix the problem" is OK, "fix you" is not)

## Verification

### Grep Checks
```bash
grep -n "addicts" src/lib/governance/policies/stigma-language.ts
# Output: 21:  'addicts', // plural form ✅

grep -n "crazier" src/lib/governance/policies/stigma-language.ts
# Output: 42:  'crazier', // comparative form ✅

grep -n "fix" src/lib/governance/policies/stigma-language.ts
# Output: 103:  'fix', // "we will fix you" implies person is broken ✅

grep -n "heal" src/lib/governance/policies/stigma-language.ts
# Output: 104:  'heal', // "we will heal you" medicalizes identity ✅
```

### Manual Testing
**Original UAT Test Case:**
Input: "In 2026, addicts are more crazier than ever. We will fix you."

**Expected Result:** Multiple violations detected
- "addicts" - flagged as stigmatizing substance use language ✅
- "crazier" - flagged as stigmatizing mental health language ✅
- "fix" - flagged as stigmatizing cure language ✅

**Actual Result:** ✅ All three terms now trigger violations

### Additional Test Cases

**Test 1: Inflected Forms**
Input: "Many addicts struggle daily"
Expected: Violation for "addicts" ✅

Input: "This situation is getting crazier and craziest"
Expected: Violations for both "crazier" and "craziest" ✅

**Test 2: Cure Language**
Input: "We will fix you and heal your problems"
Expected: Violations for "fix" and "heal" ✅

Input: "Our program can cure mental illness and repair damaged people"
Expected: Violations for "cure" and "repair" ✅

## Impact

### UAT Test 5: Governance Validation
**Before:** ❌ Major - Test input "addicts are crazier...fix you" showed "No policy violations detected"
**After:** ✅ Pass - Multiple violations detected for addicts, crazier, and fix

### Coverage Improvement
**Before:** 78 stigmatizing terms
**After:** 85 stigmatizing terms (+9% coverage)

**New Coverage:**
- Plural forms of substance use terms
- Comparative/superlative forms of mental health terms
- Cure language terms that medicalize identity

## Files Modified
- `src/lib/governance/policies/stigma-language.ts`

## Dependencies
None - all changes to static data array

## Notes
- Existing 78 terms preserved (no deletions)
- Alphabetical grouping maintained within sections
- All comments and alternatives preserved
- TypeScript type `StigmaTerm` auto-updates to include new terms
- Validator logic unchanged - uses same word-boundary regex pattern
- Future enhancement: Context-aware validation to distinguish "fix the problem" vs "fix you"
