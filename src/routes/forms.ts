import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { formService } from '../services/forms'
import { buildValidationSchema } from '../lib/form-validation'

export const formRoutes = new Hono()

const formIdParamsSchema = z.object({
  formId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid form ID format'
  ),
})

const submissionBodySchema = z.object({
  data: z.record(z.string(), z.unknown()),
  metadata: z
    .object({
      referrer: z.string().optional(),
      userAgent: z.string().optional(),
      locale: z.string().optional(),
    })
    .passthrough()
    .optional(),
})

formRoutes.post(
  '/forms/:formId/submissions',
  zValidator('param', formIdParamsSchema),
  zValidator('json', submissionBodySchema),
  async (c) => {
    try {
      const { formId } = c.req.valid('param')
      const body = c.req.valid('json')

      const form = await formService.getFormById(formId)

      if (!form) {
        return c.json(
          { success: false, error: 'Form not found or not published' },
          404
        )
      }

      const { schema, fields } = buildValidationSchema(form)
      const result = schema.safeParse(body.data)

      if (!result.success) {
        const fieldErrors = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))

        return c.json(
          { success: false, error: 'Validation failed', fieldErrors },
          422
        )
      }

      const knownKeys = new Set(fields.filter((f) => !f.hidden).map((f) => f.key))
      const sanitizedData: Record<string, unknown> = {}

      for (const key of Object.keys(result.data)) {
        if (knownKeys.has(key)) {
          sanitizedData[key] = result.data[key]
        }
      }

      const submission = await formService.submitForm(
        formId,
        sanitizedData,
        body.metadata ?? null
      )

      return c.json({ success: true, data: { id: submission.id, created_at: submission.created_at } }, 201)
    } catch (error) {
      console.error('Error submitting form:', error)
      return c.json(
        { success: false, error: 'Failed to submit form' },
        500
      )
    }
  }
)
