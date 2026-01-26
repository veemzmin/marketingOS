import { z } from 'zod'

export const contentFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  body: z.string().min(50, 'Content must be at least 50 characters').max(50000, 'Content must be less than 50,000 characters'),
  topic: z.enum(['mental-health', 'substance-use', 'wellness', 'crisis'], {
    message: 'Invalid topic',
  }),
  audience: z.enum(['patients', 'families', 'professionals', 'general'], {
    message: 'Invalid audience',
  }),
  tone: z.enum(['informative', 'supportive', 'clinical', 'motivational'], {
    message: 'Invalid tone',
  }),
})

export type ContentFormData = z.infer<typeof contentFormSchema>
