import { supabase } from '../lib/supabase'
import type { Tables } from '../types/supabase'

type CmsWebsite = Tables<'cms_websites'>
type CmsPage = Tables<'cms_pages'>
type CmsContentSection = Tables<'cms_content_sections'>
type CmsContentField = Tables<'cms_content_fields'>
type CmsCollection = Tables<'cms_collections'>
type CmsCollectionEntry = Tables<'cms_collection_entries'>
type CmsForm = Tables<'cms_forms'>
type CmsPageMetadata = Tables<'cms_page_metadata'>
type CmsSchemaField = Tables<'cms_schema_fields'>
type CmsSchemaSection = Tables<'cms_schema_sections'>
type CmsLayout = Tables<'cms_layouts'>
type CmsLayoutEntry = Tables<'cms_layout_entries'>
type CmsLayoutOverride = Tables<'cms_layout_overrides'>
type CmsPageRow = CmsPage & {
  cms_content_sections?: CmsContentSectionRow[] | null
}
type CmsContentFieldRow = CmsContentField & {
  cms_schema_fields?: CmsSchemaField | CmsSchemaField[] | null
}
type CmsContentSectionRow = CmsContentSection & {
  cms_schema_sections?: CmsSchemaSection | CmsSchemaSection[] | null
  cms_content_fields?: CmsContentFieldRow[] | null
}
type CmsCollectionEntryRow = CmsCollectionEntry & {
  cms_collections?: CmsCollection | CmsCollection[] | null
}
type CmsLayoutEntryRow = CmsLayoutEntry & {
  cms_layouts?: CmsLayout | CmsLayout[] | null
}
type CmsLayoutOverrideRow = CmsLayoutOverride & {
  cms_layout_entries?: CmsLayoutEntryRow | CmsLayoutEntryRow[] | null
}

type PageSummary = Pick<CmsPage, 'id' | 'slug' | 'name' | 'status'>
type LayoutSummary = Pick<CmsLayout, 'id' | 'name'>
type ContentFieldResponse = Pick<CmsContentField, 'id' | 'order'> & {
  type: CmsContentField['type'] | 'form'
  content: CmsContentField['content'] | ContentSectionResponse[] | ContactFormMetadata
  field_key: string | null
}
type ContentSectionResponse = {
  id: string
  name: string
  type: string
  order: number | null
  fields: ContentFieldResponse[]
}

type SectionField = CmsContentField & {
  schemaField: CmsSchemaField | null
}

type PageSection = CmsContentSection & {
  schemaSection: CmsSchemaSection | null
  fields: SectionField[]
}

type PageCollectionSection = CmsContentSection & {
  schemaSection?: CmsSchemaSection | null
  fields: SectionField[]
  collectionEntry?: CmsCollectionEntry | null
  collection?: CmsCollection | null
}

type PageLayoutOverride = CmsLayoutOverride & {
  layoutEntry: CmsLayoutEntry | null
  layout: LayoutSummary | null
}

type PageLayoutEntry = {
  id: string | null
  name: string | null
  sections: ContentSectionResponse[]
}

type ReferenceFieldConfig = {
  fieldId: string
  collectionId: string
  entryIds: string[]
  includeAll: boolean
}

type WebsiteScope = {
  websiteId: string
  tenantId: string
}

type ContactFormMetadata = Pick<CmsForm, 'id' | 'name' | 'published' | 'description' | 'content' | 'share_url' | 'settings'>

type ContactFormFieldConfig = {
  fieldId: string
  formId: string
}

type FieldResolutionContext = {
  referenceContentByFieldId: Map<string, ContentSectionResponse[]>
  formByFieldId: Map<string, ContactFormMetadata>
}

const PAGE_SELECT = `
  *,
  cms_content_sections (
    *,
    cms_schema_sections (*),
    cms_content_fields:cms_content_fields!cms_content_fields_section_id_fkey (
      *,
      cms_schema_fields (*)
    )
  )
`

const COLLECTIONS_SELECT = `
  *,
  cms_collection_entries (*)
`

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function createEmptyResult<T>() {
  return Promise.resolve({ data: [] as T[], error: null })
}

async function getWebsiteScope(websiteId: string): Promise<WebsiteScope | null> {
  const { data, error } = await supabase
    .from('cms_websites')
    .select('id, tenant_id')
    .eq('id', websiteId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    websiteId: data.id,
    tenantId: data.tenant_id,
  }
}

function normalizeRouteCandidates(slug: string) {
  const baseSlug = slug.startsWith('/') ? slug : `/${slug}`
  const trimmed = baseSlug.replace(/\/+$/, '') || '/'

  return Array.from(new Set([
    slug,
    baseSlug,
    trimmed,
    `${trimmed}/`,
  ]))
}

function normalizeSlugSegment(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function getSlugSegmentCandidates(value: string) {
  const normalized = normalizeSlugSegment(value)

  return Array.from(new Set([
    value,
    normalized,
    `/${normalized}`,
    `${normalized}/`,
    `/${normalized}/`,
  ].filter((candidate) => candidate.length > 0)))
}

function routePatternMatchesSlug(routePattern: string | null, slug: string) {
  if (!routePattern) {
    return false
  }

  const candidates = normalizeRouteCandidates(slug)
  return candidates.includes(routePattern)
}

async function getPageById(websiteId: string, pageId: string) {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('website_id', websiteId)
    .eq('id', pageId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }

    throw error
  }

  return data
}

async function getPageBySlug(websiteId: string, slug: string) {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('website_id', websiteId)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }

    throw error
  }

  return data
}

async function getPageMetadata(pageId: string) {
  const { data, error } = await supabase
    .from('cms_page_metadata')
    .select('*')
    .eq('page_id', pageId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as CmsPageMetadata | null
}

async function getResolvedLayoutOverrides(page: CmsPage) {
  if (!page.website_id) {
    return []
  }

  const { data, error } = await supabase
    .from('cms_layout_overrides')
    .select(`
      *,
      cms_layout_entries (
        *,
        cms_layouts (*)
      )
    `)
    .eq('website_id', page.website_id)
    .eq('enabled', true)
    .order('priority', { ascending: false })

  if (error) {
    throw error
  }

  const matched = ((data ?? []) as CmsLayoutOverrideRow[])
    .filter((override) => {
      const pageMatch = override.page_id === page.id
      const routeMatch = routePatternMatchesSlug(override.route_pattern, page.slug)
      return pageMatch || routeMatch
    })
    .map((override) => {
      const layoutEntry = getSingleRelation(override.cms_layout_entries)
      const layout = getSingleRelation(layoutEntry?.cms_layouts)

      const normalizedOverride: PageLayoutOverride = {
        ...override,
        layoutEntry,
        layout: mapLayoutSummary(layout),
      }

      return normalizedOverride
    })

  return matched
}

async function getLayoutEntriesByWebsite(websiteId: string, options?: { pageId?: string; defaultOnly?: boolean }) {
  const { data, error } = await supabase
    .from('cms_content_sections')
    .select(`
      *,
      cms_schema_sections (*),
      cms_content_fields:cms_content_fields!cms_content_fields_section_id_fkey (
        *,
        cms_schema_fields (*)
      ),
      cms_layout_entries (
        *,
        cms_layouts (*)
      )
    `)
    .or(options?.pageId ? `page_id.eq.${options.pageId},page_id.is.null` : 'page_id.is.null')
    .not('layout_entry_id', 'is', null)
    .order('order', { ascending: true })

  if (error) {
    throw error
  }

  const sections = ((data ?? []) as Array<CmsContentSectionRow & {
    cms_layout_entries?: CmsLayoutEntryRow | CmsLayoutEntryRow[] | null
  }>)
    .filter((section) => {
      const layoutEntry = getSingleRelation(section.cms_layout_entries)
      const layout = getSingleRelation(layoutEntry?.cms_layouts)

      if (layout?.website_id !== websiteId) {
        return false
      }

      if (options?.defaultOnly && !layoutEntry?.is_default) {
        return false
      }

      return true
    })
    .map((section) => ({
      ...section,
      schemaSection: getSingleRelation(section.cms_schema_sections),
      fields: (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
        .map(mapSectionField)
        .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const groupedSections = new Map<string, typeof sections>()

  for (const section of sections) {
    const layoutEntryId = section.layout_entry_id

    if (!layoutEntryId) {
      continue
    }

    const existingSections = groupedSections.get(layoutEntryId) ?? []
    existingSections.push(section)
    groupedSections.set(layoutEntryId, existingSections)
  }

  const selectedSections = Array.from(groupedSections.values()).flatMap((entrySections) => {
    if (!options?.pageId) {
      return entrySections
    }

    const pageSpecificSections = entrySections.filter((section) => section.page_id === options.pageId)
    return pageSpecificSections.length > 0 ? pageSpecificSections : entrySections
  })
  const selectedSectionsWithLinkedForms = await includeLinkedContactFormFields(selectedSections)

  const websiteScope = await getWebsiteScope(websiteId)
  const fieldResolutionContext = await resolveFieldContext(selectedSectionsWithLinkedForms, websiteScope)
  const entriesById = new Map<string, PageLayoutEntry>()

  for (const section of selectedSectionsWithLinkedForms) {
    const layoutEntryId = section.layout_entry_id

    if (!layoutEntryId) {
      continue
    }

    const relatedEntry = getSingleRelation(section.cms_layout_entries)
    const existingEntry = entriesById.get(layoutEntryId)
    const mappedSection = mapContentSection(section, fieldResolutionContext)

    if (existingEntry) {
      existingEntry.sections.push(mappedSection)
      continue
    }

    entriesById.set(layoutEntryId, {
      id: relatedEntry?.cms_layouts ? getSingleRelation(relatedEntry.cms_layouts)?.id ?? null : null,
      name: relatedEntry?.cms_layouts ? getSingleRelation(relatedEntry.cms_layouts)?.name ?? null : null,
      sections: [mappedSection],
    })
  }

  return Array.from(entriesById.values()).sort((a, b) => {
    const left = a.name ?? a.id ?? ''
    const right = b.name ?? b.id ?? ''
    return left.localeCompare(right)
  })
}

async function getPageLayoutEntries(page: CmsPage) {
  return getLayoutEntriesByWebsite(page.website_id ?? '', { pageId: page.id })
}

function mapSectionField(field: CmsContentFieldRow): SectionField {
  return {
    ...field,
    schemaField: getSingleRelation(field.cms_schema_fields),
  }
}

function mapPageSections(page: CmsPageRow): PageSection[] {
  const sections = Array.isArray(page?.cms_content_sections) ? page.cms_content_sections : []

  return sections.map((section) => ({
    ...section,
    schemaSection: getSingleRelation(section.cms_schema_sections),
    fields: (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
      .map(mapSectionField)
      .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0)),
  })).sort((a: PageSection, b: PageSection) => (a.order ?? 0) - (b.order ?? 0))
}

function createSyntheticContactFormField(sectionId: string, schemaField: CmsSchemaField): SectionField {
  return {
    id: `schema-${schemaField.id}-${sectionId}`,
    section_id: sectionId,
    schema_field_id: schemaField.id,
    type: schemaField.type,
    name: schemaField.name,
    order: schemaField.order,
    content: null,
    collection_id: schemaField.collection_id,
    parent_field_id: schemaField.parent_field_id,
    created_at: null,
    updated_at: null,
    schemaField,
  }
}

async function includeLinkedContactFormFields<T extends { id: string; schemaSection?: CmsSchemaSection | null; fields: SectionField[] }>(
  sections: T[]
): Promise<T[]> {
  const schemaSectionIds = Array.from(new Set(
    sections
      .map((section) => section.schemaSection?.id)
      .filter((schemaSectionId): schemaSectionId is string => Boolean(schemaSectionId))
  ))

  if (schemaSectionIds.length === 0) {
    return sections
  }

  const { data, error } = await supabase
    .from('cms_schema_fields')
    .select('*')
    .in('schema_section_id', schemaSectionIds)
    .eq('type', 'contact_form')
    .not('form_id', 'is', null)
    .order('order', { ascending: true })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return sections
  }

  const schemaFieldsBySectionId = new Map<string, CmsSchemaField[]>()

  for (const schemaField of data as CmsSchemaField[]) {
    const existingFields = schemaFieldsBySectionId.get(schemaField.schema_section_id) ?? []
    existingFields.push(schemaField)
    schemaFieldsBySectionId.set(schemaField.schema_section_id, existingFields)
  }

  return sections.map((section) => {
    const schemaSectionId = section.schemaSection?.id

    if (!schemaSectionId) {
      return section
    }

    const linkedContactSchemaFields = schemaFieldsBySectionId.get(schemaSectionId) ?? []

    if (linkedContactSchemaFields.length === 0) {
      return section
    }

    const existingSchemaFieldIds = new Set(
      section.fields
        .map((field) => field.schemaField?.id)
        .filter((schemaFieldId): schemaFieldId is string => Boolean(schemaFieldId))
    )

    const injectedFields = linkedContactSchemaFields
      .filter((schemaField) => !existingSchemaFieldIds.has(schemaField.id))
      .map((schemaField) => createSyntheticContactFormField(section.id, schemaField))

    if (injectedFields.length === 0) {
      return section
    }

    return {
      ...section,
      fields: [...section.fields, ...injectedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }
  })
}

function getReferenceFieldConfig(field: SectionField): ReferenceFieldConfig | null {
  if (field.type !== 'reference') {
    return null
  }

  const collectionId = field.schemaField?.collection_id ?? field.collection_id

  if (!collectionId || !field.content || typeof field.content !== 'object' || Array.isArray(field.content)) {
    return null
  }

  const entryIdsValue = (field.content as Record<string, unknown>).entry_ids

  if (entryIdsValue === 'ALL') {
    return {
      fieldId: field.id,
      collectionId,
      entryIds: [],
      includeAll: true,
    }
  }

  if (Array.isArray(entryIdsValue)) {
    return {
      fieldId: field.id,
      collectionId,
      entryIds: entryIdsValue.filter((entryId): entryId is string => typeof entryId === 'string'),
      includeAll: false,
    }
  }

  if (typeof entryIdsValue === 'string' && entryIdsValue.length > 0) {
    return {
      fieldId: field.id,
      collectionId,
      entryIds: [entryIdsValue],
      includeAll: false,
    }
  }

  return null
}

async function resolveReferenceFieldContent(sections: Array<{ fields: SectionField[] }>) {
  const referenceConfigs = sections
    .flatMap((section) => section.fields)
    .map((field) => getReferenceFieldConfig(field))
    .filter((config): config is ReferenceFieldConfig => Boolean(config))

  if (referenceConfigs.length === 0) {
    return new Map<string, ContentSectionResponse[]>()
  }

  const allCollectionIds = Array.from(new Set(
    referenceConfigs
      .filter((config) => config.includeAll)
      .map((config) => config.collectionId)
  ))

  const specificEntryIds = Array.from(new Set(
    referenceConfigs.flatMap((config) => config.entryIds)
  ))

  const [allEntriesResult, specificEntriesResult] = await Promise.all([
    allCollectionIds.length > 0
      ? supabase
          .from('cms_collection_entries')
          .select(`
            *,
            cms_collections (*)
          `)
          .in('collection_id', allCollectionIds)
          .order('created_at', { ascending: true })
      : createEmptyResult<CmsCollectionEntryRow>(),
    specificEntryIds.length > 0
      ? supabase
          .from('cms_collection_entries')
          .select(`
            *,
            cms_collections (*)
          `)
          .in('id', specificEntryIds)
          .order('created_at', { ascending: true })
      : createEmptyResult<CmsCollectionEntryRow>(),
  ])

  if (allEntriesResult.error) {
    throw allEntriesResult.error
  }

  if (specificEntriesResult.error) {
    throw specificEntriesResult.error
  }

  const rawEntries = [...(allEntriesResult.data ?? []), ...(specificEntriesResult.data ?? [])]
  const entryRowsById = new Map<string, { entry: CmsCollectionEntry; collection: CmsCollection | null }>()

  for (const rawEntry of rawEntries as CmsCollectionEntryRow[]) {
    if (entryRowsById.has(rawEntry.id)) {
      continue
    }

    const collection = getSingleRelation(rawEntry.cms_collections)

    entryRowsById.set(rawEntry.id, {
      entry: rawEntry,
      collection,
    })
  }

  const resolvedEntryIds = Array.from(entryRowsById.keys())

  if (resolvedEntryIds.length === 0) {
    return new Map<string, ContentSectionResponse[]>()
  }

  const { data: rawSections, error: sectionsError } = await supabase
    .from('cms_content_sections')
    .select(`
      *,
      cms_content_fields:cms_content_fields!cms_content_fields_section_id_fkey (
        *,
        cms_schema_fields (*)
      )
    `)
    .in('cms_collection_entry_id', resolvedEntryIds)
    .order('order', { ascending: true })

  if (sectionsError) {
    throw sectionsError
  }

  const sectionsByEntryId = new Map<string, ContentSectionResponse[]>()
  const groupedRawSections = new Map<string, CmsContentSectionRow[]>()

  for (const rawSection of (rawSections ?? []) as CmsContentSectionRow[]) {
    const entryId = rawSection.cms_collection_entry_id

    if (!entryId) {
      continue
    }

    const existingSections = groupedRawSections.get(entryId) ?? []
    existingSections.push(rawSection)
    groupedRawSections.set(entryId, existingSections)
  }

  groupedRawSections.forEach((entrySections, entryId) => {
    const canonicalSections = entrySections.some((section) => section.page_id === null)
      ? entrySections.filter((section) => section.page_id === null)
      : entrySections

    const mappedSections = canonicalSections
      .map((section) => {
        const fields = (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
          .map(mapSectionField)
          .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0))

        return mapContentSection({
          id: section.id,
          name: section.name,
          type: section.type,
          order: section.order,
          fields,
        })
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    sectionsByEntryId.set(entryId, mappedSections)
  })

  const entriesByCollectionId = new Map<string, ContentSectionResponse[][]>()
  const entrySectionsById = new Map<string, ContentSectionResponse[]>()

  entryRowsById.forEach(({ entry }, entryId) => {
    const resolvedSections = sectionsByEntryId.get(entryId) ?? []
    entrySectionsById.set(entryId, resolvedSections)

    const collectionEntries = entriesByCollectionId.get(entry.collection_id) ?? []
    collectionEntries.push(resolvedSections)
    entriesByCollectionId.set(entry.collection_id, collectionEntries)
  })

  const resolvedContentByFieldId = new Map<string, ContentSectionResponse[]>()

  for (const config of referenceConfigs) {
    const resolvedEntries = config.includeAll
      ? entriesByCollectionId.get(config.collectionId) ?? []
      : config.entryIds
          .map((entryId) => entrySectionsById.get(entryId))
          .filter((entrySections): entrySections is ContentSectionResponse[] => Boolean(entrySections))

    resolvedContentByFieldId.set(config.fieldId, resolvedEntries.flat())
  }

  return resolvedContentByFieldId
}

function getContactFormFieldConfig(field: SectionField): ContactFormFieldConfig | null {
  if (field.schemaField?.type !== 'contact_form' || !field.schemaField.form_id) {
    return null
  }

  return {
    fieldId: field.id,
    formId: field.schemaField.form_id,
  }
}

async function resolveContactFormContent(
  sections: Array<{ fields: SectionField[] }>,
  websiteScope: WebsiteScope | null
) {
  if (!websiteScope) {
    return new Map<string, ContactFormMetadata>()
  }

  const formConfigs = sections
    .flatMap((section) => section.fields)
    .map((field) => getContactFormFieldConfig(field))
    .filter((config): config is ContactFormFieldConfig => Boolean(config))

  if (formConfigs.length === 0) {
    return new Map<string, ContactFormMetadata>()
  }

  const formIds = Array.from(new Set(formConfigs.map((config) => config.formId)))
  const { data, error } = await supabase
    .from('cms_forms')
    .select('id, name, published, description, content, share_url, settings')
    .eq('tenant_id', websiteScope.tenantId)
    .eq('website_id', websiteScope.websiteId)
    .is('archived_at', null)
    .in('id', formIds)

  if (error) {
    throw error
  }

  const formsById = new Map<string, ContactFormMetadata>()

  for (const form of (data ?? []) as ContactFormMetadata[]) {
    formsById.set(form.id, form)
  }

  const formByFieldId = new Map<string, ContactFormMetadata>()

  for (const config of formConfigs) {
    const form = formsById.get(config.formId)

    if (form) {
      formByFieldId.set(config.fieldId, form)
    }
  }

  return formByFieldId
}

async function resolveFieldContext(
  sections: Array<{ fields: SectionField[] }>,
  websiteScope: WebsiteScope | null
): Promise<FieldResolutionContext> {
  const [referenceContentByFieldId, formByFieldId] = await Promise.all([
    resolveReferenceFieldContent(sections),
    resolveContactFormContent(sections, websiteScope),
  ])

  return {
    referenceContentByFieldId,
    formByFieldId,
  }
}

function mapPageSummary(page: CmsPage): PageSummary {
  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    status: page.status,
  }
}

function mapLayoutSummary(layout: CmsLayout | null): LayoutSummary | null {
  if (!layout) {
    return null
  }

  return {
    id: layout.id,
    name: layout.name,
  }
}

function mapContentField(
  field: CmsContentField | SectionField,
  fieldResolutionContext?: FieldResolutionContext
): ContentFieldResponse {
  const resolvedForm = fieldResolutionContext?.formByFieldId.get(field.id)

  if (resolvedForm) {
    return {
      id: field.id,
      type: 'form',
      content: resolvedForm,
      order: field.order,
      field_key: 'schemaField' in field ? field.schemaField?.field_key ?? null : null,
    }
  }

  return {
    id: field.id,
    type: field.type,
    content: fieldResolutionContext?.referenceContentByFieldId.get(field.id) ?? field.content,
    order: field.order,
    field_key: 'schemaField' in field ? field.schemaField?.field_key ?? null : null,
  }
}

function mapContentSection(
  section: { id: string; name: string; type?: string | null; order: number | null; fields: CmsContentField[] | SectionField[] },
  fieldResolutionContext?: FieldResolutionContext
): ContentSectionResponse {
  return {
    id: section.id,
    name: section.name,
    type: section.type ?? 'section',
    order: section.order,
    fields: section.fields
      .map((field) => mapContentField(field, fieldResolutionContext))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }
}

async function getCollectionEntrySections(entryId: string, websiteScope: WebsiteScope | null) {
  const { data, error } = await supabase
    .from('cms_content_sections')
    .select(`
      *,
      cms_content_fields:cms_content_fields!cms_content_fields_section_id_fkey (
        *,
        cms_schema_fields (*)
      )
    `)
    .eq('cms_collection_entry_id', entryId)
    .order('order', { ascending: true })

  if (error) {
    throw error
  }

  const sections = ((data ?? []) as CmsContentSectionRow[])
    .map((section) => ({
      ...section,
      fields: (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
        .map(mapSectionField)
        .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .sort((a: PageCollectionSection, b: PageCollectionSection) => (a.order ?? 0) - (b.order ?? 0))

  const fieldResolutionContext = await resolveFieldContext(sections, websiteScope)

  return sections.map((section) => mapContentSection(section, fieldResolutionContext))
}

export const cmsService = {
  async getPagesByWebsiteId(websiteId: string) {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return data ?? []
  },

  async getPageContent(websiteId: string, pageId: string) {
    const { data, error } = await supabase
      .from('cms_pages')
      .select(PAGE_SELECT)
      .eq('website_id', websiteId)
      .eq('id', pageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw error
    }

    const pageSections = await includeLinkedContactFormFields(mapPageSections(data))
    const websiteScope: WebsiteScope | null = data.tenant_id
      ? { websiteId, tenantId: data.tenant_id }
      : await getWebsiteScope(websiteId)
    const fieldResolutionContext = await resolveFieldContext(pageSections, websiteScope)

    return {
      page: mapPageSummary(data),
      sections: pageSections.map((section) => mapContentSection(section, fieldResolutionContext)),
    }
  },

  async getPageContentBySlug(websiteId: string, slug: string) {
    const page = await getPageBySlug(websiteId, slug)

    if (!page) {
      return null
    }

    return this.getPageContent(websiteId, page.id)
  },

  async getWebsiteById(websiteId: string) {
    const { data, error } = await supabase
      .from('cms_websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw error
    }

    return data
  },

  async getCollections() {
    const { data, error } = await supabase
      .from('cms_collections')
      .select(COLLECTIONS_SELECT)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return data ?? []
  },

  async getCollectionItems(collectionId: string) {
    const { data, error } = await supabase
      .from('cms_collection_entries')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return data ?? []
  },

  async getCollectionEntryBySlug(websiteId: string, prefixSlug: string, entrySlug: string) {
    const normalizedEntrySlug = normalizeSlugSegment(entrySlug)
    const prefixCandidates = getSlugSegmentCandidates(prefixSlug)
    const entryCandidates = getSlugSegmentCandidates(normalizedEntrySlug)

    const { data, error } = await supabase
      .from('cms_collection_entries')
      .select(`
        *,
        cms_collections!inner (*)
      `)
      .eq('cms_collections.website_id', websiteId)
      .in('cms_collections.slug_prefix', prefixCandidates)
      .in('slug', entryCandidates)
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    const entry = data as CmsCollectionEntryRow
    const collection = getSingleRelation(entry.cms_collections)

    if (!collection) {
      return null
    }

    const { cms_collections: _cmsCollections, ...entryData } = entry
    const websiteScope = await getWebsiteScope(websiteId)
    const sections = await getCollectionEntrySections(entry.id, websiteScope)

    return {
      entry: entryData,
      sections,
    }
  },

  async getPageWithLayout(websiteId: string, pageId: string) {
    const page = await getPageById(websiteId, pageId)

    if (!page) {
      return null
    }

    const [entries, overrides] = await Promise.all([
      getPageLayoutEntries(page),
      getResolvedLayoutOverrides(page),
    ])

    return {
      page: mapPageSummary(page),
      layout: {
        entries,
        overrides,
      },
    }
  },

  async getPageWithLayoutBySlug(websiteId: string, slug: string) {
    const page = await getPageBySlug(websiteId, slug)

    if (!page) {
      return null
    }

    const [entries, overrides] = await Promise.all([
      getPageLayoutEntries(page),
      getResolvedLayoutOverrides(page),
    ])

    return {
      page: mapPageSummary(page),
      layout: {
        entries,
        overrides,
      },
    }
  },

  async getDefaultLayouts(websiteId: string) {
    const entries = await getLayoutEntriesByWebsite(websiteId)

    return {
      layout: {
        entries,
        overrides: [],
      },
    }
  },

  async getPageCollectionData(pageId: string, websiteId: string) {
    const { data: sections, error: sectionsError } = await supabase
      .from('cms_content_sections')
      .select(`
        *,
        cms_schema_sections (*)
      `)
      .eq('page_id', pageId)
      .order('order', { ascending: true })

    if (sectionsError) {
      throw sectionsError
    }

    const sectionIds = (sections ?? []).map((section) => section.id)
    const collectionEntryIds = (sections ?? [])
      .map((section) => section.cms_collection_entry_id)
      .filter((entryId): entryId is string => Boolean(entryId))

    const [fieldsResult, collectionEntriesResult] = await Promise.all([
      sectionIds.length > 0
        ? supabase
            .from('cms_content_fields')
            .select(`
              *,
              cms_schema_fields (*)
            `)
            .in('section_id', sectionIds)
            .order('order', { ascending: true })
        : createEmptyResult<CmsContentFieldRow>(),
      collectionEntryIds.length > 0
        ? supabase
            .from('cms_collection_entries')
            .select(`
              *,
              cms_collections (*)
            `)
            .in('id', collectionEntryIds)
        : createEmptyResult<CmsCollectionEntryRow>(),
    ])

    if (fieldsResult.error) {
      throw fieldsResult.error
    }

    if (collectionEntriesResult.error) {
      throw collectionEntriesResult.error
    }

    const fieldsBySection = new Map<string, SectionField[]>()

    for (const rawField of (fieldsResult.data ?? []) as CmsContentFieldRow[]) {
      const field = mapSectionField(rawField)

      const existingFields = fieldsBySection.get(field.section_id) ?? []
      existingFields.push(field)
      fieldsBySection.set(field.section_id, existingFields)
    }

    const collectionEntryById = new Map<string, { entry: CmsCollectionEntry; collection: CmsCollection | null }>()

    for (const rawEntry of (collectionEntriesResult.data ?? []) as CmsCollectionEntryRow[]) {
      const collection = getSingleRelation(rawEntry.cms_collections)

      collectionEntryById.set(rawEntry.id, {
        entry: rawEntry,
        collection,
      })
    }

    const mappedSections: PageCollectionSection[] = (sections ?? []).map((section) => {
      const collectionData = section.cms_collection_entry_id
        ? collectionEntryById.get(section.cms_collection_entry_id)
        : undefined

      return {
        ...section,
        schemaSection: getSingleRelation(section.cms_schema_sections),
        fields: (fieldsBySection.get(section.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        collectionEntry: collectionData?.entry ?? null,
        collection: collectionData?.collection ?? null,
      }
    })
    const mappedSectionsWithLinkedForms = await includeLinkedContactFormFields(mappedSections)

    const websiteScope = await getWebsiteScope(websiteId)
    const fieldResolutionContext = await resolveFieldContext(mappedSectionsWithLinkedForms, websiteScope)

    return {
      sections: mappedSectionsWithLinkedForms.map((section) => ({
        ...mapContentSection(section, fieldResolutionContext),
        collectionEntry: section.collectionEntry ?? null,
        collection: section.collection ?? null,
      })),
    }
  },

  async getFullPageData(websiteId: string, pageId: string) {
    const [pageContent, pageWithLayout, pageCollectionData, metadata] = await Promise.all([
      this.getPageContent(websiteId, pageId),
      this.getPageWithLayout(websiteId, pageId),
      this.getPageCollectionData(pageId, websiteId),
      getPageMetadata(pageId),
    ])

    if (!pageContent || !pageWithLayout) {
      return null
    }

    const collectionSectionsById = new Map(
      pageCollectionData.sections.map((section) => [section.id, section])
    )

    return {
      page: {
        ...pageContent.page,
        metadata,
      },
      sections: pageContent.sections.map((section) => {
        const collectionSection = collectionSectionsById.get(section.id)

        return {
          ...section,
          fields: collectionSection?.fields ?? section.fields,
          collectionEntry: collectionSection?.collectionEntry ?? null,
          collection: collectionSection?.collection ?? null,
        }
      }),
      layout: pageWithLayout.layout,
    }
  },

  async getFullPageDataBySlug(websiteId: string, slug: string) {
    const page = await getPageBySlug(websiteId, slug)

    if (!page) {
      return null
    }

    return this.getFullPageData(websiteId, page.id)
  },
}
