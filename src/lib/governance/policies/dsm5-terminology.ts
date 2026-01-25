/**
 * DSM-5 Terminology Policy
 *
 * Reference list of valid DSM-5 mental health diagnoses for content validation.
 * Hardcoded for MVP - Phase 3+ will integrate official DSM-5-TR API if licensing allows.
 *
 * References:
 * - DSM-5-TR (Diagnostic and Statistical Manual of Mental Disorders, 5th Edition, Text Revision)
 * - American Psychiatric Association
 *
 * Note: This is a curated subset of 20-30 common diagnoses for MVP validation.
 * Full DSM-5 contains 300+ conditions.
 */

/**
 * Valid DSM-5 diagnostic terms (common subset for MVP).
 */
export const DSM5_TERMS = [
  // Depressive Disorders
  'major depressive disorder',
  'persistent depressive disorder',
  'dysthymia', // alternate term for persistent depressive disorder
  'disruptive mood dysregulation disorder',
  'premenstrual dysphoric disorder',

  // Anxiety Disorders
  'generalized anxiety disorder',
  'panic disorder',
  'agoraphobia',
  'social anxiety disorder',
  'social phobia', // alternate term for social anxiety disorder
  'specific phobia',
  'separation anxiety disorder',

  // Trauma and Stressor-Related Disorders
  'post-traumatic stress disorder',
  'ptsd', // common abbreviation
  'acute stress disorder',
  'adjustment disorder',

  // Obsessive-Compulsive and Related Disorders
  'obsessive-compulsive disorder',
  'ocd', // common abbreviation
  'body dysmorphic disorder',
  'hoarding disorder',
  'trichotillomania',
  'excoriation disorder',

  // Bipolar and Related Disorders
  'bipolar i disorder',
  'bipolar ii disorder',
  'bipolar disorder',
  'cyclothymic disorder',

  // Schizophrenia Spectrum and Other Psychotic Disorders
  'schizophrenia',
  'schizoaffective disorder',
  'delusional disorder',
  'brief psychotic disorder',

  // Eating Disorders
  'anorexia nervosa',
  'bulimia nervosa',
  'binge-eating disorder',
  'avoidant/restrictive food intake disorder',
  'arfid', // common abbreviation

  // Substance-Related and Addictive Disorders
  'alcohol use disorder',
  'substance use disorder',
  'cannabis use disorder',
  'opioid use disorder',
  'stimulant use disorder',
  'gambling disorder',

  // Neurodevelopmental Disorders
  'autism spectrum disorder',
  'asd', // common abbreviation
  'attention-deficit/hyperactivity disorder',
  'adhd', // common abbreviation
  'intellectual disability',

  // Personality Disorders
  'borderline personality disorder',
  'narcissistic personality disorder',
  'antisocial personality disorder',
  'avoidant personality disorder',
  'obsessive-compulsive personality disorder',

  // Sleep-Wake Disorders
  'insomnia disorder',
  'hypersomnolence disorder',
  'narcolepsy',
  'obstructive sleep apnea hypopnea',

  // Disruptive, Impulse-Control, and Conduct Disorders
  'oppositional defiant disorder',
  'intermittent explosive disorder',
  'conduct disorder',

  // Gender Dysphoria
  'gender dysphoria',
] as const

/**
 * Type-safe DSM-5 term.
 */
export type DSM5Term = typeof DSM5_TERMS[number]
