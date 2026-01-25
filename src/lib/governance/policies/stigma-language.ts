/**
 * Stigma Language Policy
 *
 * Curated list of 50-100 stigmatizing mental health terms that should be avoided.
 * Based on research recommendations from mental health advocacy organizations.
 *
 * References:
 * - SAMHSA: Words Matter - Terms to Use and Avoid When Talking About Addiction
 * - National Alliance on Mental Illness (NAMI) Language Guide
 * - American Psychological Association Style Guide
 */

/**
 * Stigmatizing terms to avoid in mental health content.
 * Each term has person-first or strength-based alternatives.
 */
export const STIGMA_TERMS = [
  // Substance use stigma
  // Alternative: "person with substance use disorder"
  'addict',
  'junkie',
  'dopehead',
  'doper',
  'druggie',
  'alcoholic',
  'drunk',
  'crackhead',
  'tweaker',
  'pothead',
  'boozer',
  'substance abuser',
  'drug abuser',

  // Mental health stigma
  // Alternative: "person with schizophrenia", "person experiencing psychosis"
  'psycho',
  'psychotic', // when used pejoratively
  'schizo',
  'schizophrenic', // as noun
  'crazy',
  'insane',
  'nuts',
  'mental',
  'deranged',
  'demented',
  'lunatic',
  'maniac',
  'mad',
  'disturbed',
  'unstable',

  // Intellectual disability stigma
  // Alternative: "person with intellectual disability"
  'retarded',
  'retard',
  'idiot',
  'stupid', // in clinical context
  'dumb',
  'moron',
  'imbecile',
  'feeble-minded',

  // Trauma/PTSD stigma
  // Alternative: "person who experienced trauma", "trauma survivor"
  'damaged',
  'broken',
  'traumatized', // prefer "who experienced trauma"
  'shell-shocked',

  // Personality disorder stigma
  // Alternative: "person with borderline personality disorder"
  'borderline', // when used as noun or pejoratively
  'narcissist', // casual use for personality traits
  'sociopath', // outdated clinical term
  'psychopath', // outdated clinical term

  // Depression/suicide stigma
  // Alternative: "died by suicide"
  'committed suicide', // implies crime
  'successful suicide', // implies positive outcome
  'failed suicide attempt',
  'attention-seeking',
  'manipulative', // in mental health context
  'lazy', // for depression symptoms

  // General stigmatizing language
  // Alternative: "living with", "person with mental illness"
  'suffering from',
  'afflicted with',
  'victim of', // prefer "person living with"
  'stricken with',
  'plagued by',
  'handicapped',
  'invalid',
  'confined to', // e.g., "confined to wheelchair"

  // Eating disorder stigma
  // Alternative: "person with anorexia", "person with bulimia"
  'anorexic', // as noun
  'bulimic', // as noun
  'binge eater',

  // Addiction-specific stigma
  'clean', // for sobriety (implies previous "dirtiness")
  'dirty', // for relapse or positive drug test
  'habit', // minimizes addiction severity
  'recreational drug use', // in addiction context

  // Autism/developmental stigma
  'autistic', // as noun (adjective-first is preferred by some, but check context)
  'suffers from autism',
  'high-functioning',
  'low-functioning',
  'mild', // autism
  'severe', // autism as judgment

  // Self-harm stigma
  'cutter',
  'self-mutilator',
  'attention-seeking', // for self-harm

  // General mental health
  'normal', // implies others are abnormal
  'abnormal',
  'defective',
  'disabled', // when used pejoratively
] as const

/**
 * Type-safe array of stigmatizing terms.
 */
export type StigmaTerm = typeof STIGMA_TERMS[number]
