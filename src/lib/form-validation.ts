import { z } from 'zod'
import type { Tables } from '../types/supabase'

type CmsForm = Tables<'cms_forms'>

export type FormFieldDefinition = {
  id: string
  key: string
  type: string
  label: string
  required?: boolean
  hidden?: boolean
  placeholder?: string
  conditionalLogic?: unknown
}

function buildZodSchemaFromFormFields(fields: FormFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if (field.hidden) continue

    let validator: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        validator = z.string().email(`${field.label} must be a valid email address`)
        break
      case 'phone':
        validator = z
          .string()
          .regex(
            /^\+?[0-9\s\-()]{6,20}$/,
            `${field.label} must be a valid phone number`
          )
        break
      case 'number':
        validator = z.number({ invalid_type_error: `${field.label} must be a number` })
        break
      case 'checkbox':
      case 'boolean':
        validator = z.boolean({ invalid_type_error: `${field.label} must be a boolean` })
        break
      case 'date':
        validator = z.string().refine(
          (val) => !isNaN(Date.parse(val)),
          { message: `${field.label} must be a valid date` }
        )
        break
      case 'select':
      case 'radio':
        validator = z.string().min(1, `${field.label} is required`)
        break
      case 'textarea':
      case 'richtext':
      case 'text':
      default:
        validator = z.string()
        break
    }

    if (field.required) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, `${field.label} is required`)
      }
    } else {
      validator = validator.optional().or(z.literal(''))
    }

    shape[field.key] = validator
  }

  return z.object(shape)
}

export function parseFormContent(form: CmsForm): FormFieldDefinition[] {
  const content = form.content as unknown

  if (Array.isArray(content)) {
    return content as FormFieldDefinition[]
  }

  if (content && typeof content === 'object' && 'content' in content) {
    const nested = (content as { content: unknown }).content
    if (Array.isArray(nested)) {
      return nested as FormFieldDefinition[]
    }
  }

  return []
}

export function buildValidationSchema(form: CmsForm) {
  const fields = parseFormContent(form)
  return { schema: buildZodSchemaFromFormFields(fields), fields }
}
