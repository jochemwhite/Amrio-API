import { supabase } from '../lib/supabase'
import type { Tables } from '../types/supabase'

type CmsWebsite = Tables<'cms_websites'>
type CmsPage = Tables<'cms_pages'>
type CmsContentSection = Tables<'cms_content_sections'>
type CmsContentField = Tables<'cms_content_fields'>
type CmsCollection = Tables<'cms_collections'>
type CmsCollectionEntry = Tables<'cms_collection_entries'>
type CmsSchemaField = Tables<'cms_schema_fields'>
type CmsSchemaSection = Tables<'cms_schema_sections'>
type CmsLayout = Tables<'cms_layouts'>
type CmsLayoutEntry = Tables<'cms_layout_entries'>
type CmsLayoutOverride = Tables<'cms_layout_overrides'>

type PageSummary = Pick<CmsPage, 'id' | 'slug' | 'name' | 'status'>
type ContentFieldResponse = Pick<CmsContentField, 'id' | 'type' | 'order'> & {
  content: CmsContentField['content'] | ContentSectionResponse[]
  field_key: string | null
}
type ContentSectionResponse = Pick<CmsContentSection, 'id' | 'name' | 'order'> & {
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
  fields: SectionField[]
  collectionEntry?: CmsCollectionEntry | null
  collection?: CmsCollection | null
}

type PageLayoutOverride = CmsLayoutOverride & {
  layoutEntry: CmsLayoutEntry | null
  layout: CmsLayout | null
}

type ReferenceFieldConfig = {
  fieldId: string
  collectionId: string
  entryIds: string[]
  includeAll: boolean
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

  const matched = (data ?? [])
    .filter((override) => {
      const pageMatch = override.page_id === page.id
      const routeMatch = routePatternMatchesSlug(override.route_pattern, page.slug)
      return pageMatch || routeMatch
    })
    .map((override) => {
      const layoutEntry = Array.isArray(override.cms_layout_entries)
        ? override.cms_layout_entries[0] ?? null
        : override.cms_layout_entries ?? null

      const layout = layoutEntry && Array.isArray(layoutEntry.cms_layouts)
        ? layoutEntry.cms_layouts[0] ?? null
        : layoutEntry?.cms_layouts ?? null

      const normalizedOverride: PageLayoutOverride = {
        ...(override as CmsLayoutOverride),
        layoutEntry: layoutEntry as CmsLayoutEntry | null,
        layout: layout as CmsLayout | null,
      }

      return normalizedOverride
    })

  return matched
}

function mapPageSections(page: any): PageSection[] {
  const sections = Array.isArray(page?.cms_content_sections) ? page.cms_content_sections : []

  return sections.map((section: any) => ({
    ...(section as CmsContentSection),
    schemaSection: Array.isArray(section.cms_schema_sections)
      ? section.cms_schema_sections[0] ?? null
      : section.cms_schema_sections ?? null,
    fields: (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
      .map((field: any) => ({
        ...(field as CmsContentField),
        schemaField: Array.isArray(field.cms_schema_fields)
          ? field.cms_schema_fields[0] ?? null
          : field.cms_schema_fields ?? null,
      }))
      .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0)),
  })).sort((a: PageSection, b: PageSection) => (a.order ?? 0) - (b.order ?? 0))
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
      : Promise.resolve({ data: [], error: null }),
    specificEntryIds.length > 0
      ? supabase
          .from('cms_collection_entries')
          .select(`
            *,
            cms_collections (*)
          `)
          .in('id', specificEntryIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (allEntriesResult.error) {
    throw allEntriesResult.error
  }

  if (specificEntriesResult.error) {
    throw specificEntriesResult.error
  }

  const rawEntries = [...(allEntriesResult.data ?? []), ...(specificEntriesResult.data ?? [])]
  const entryRowsById = new Map<string, { entry: CmsCollectionEntry; collection: CmsCollection | null }>()

  for (const rawEntry of rawEntries) {
    if (entryRowsById.has(rawEntry.id)) {
      continue
    }

    const collection = Array.isArray(rawEntry.cms_collections)
      ? rawEntry.cms_collections[0] ?? null
      : rawEntry.cms_collections ?? null

    entryRowsById.set(rawEntry.id, {
      entry: rawEntry as CmsCollectionEntry,
      collection: collection as CmsCollection | null,
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
  const groupedRawSections = new Map<string, any[]>()

  for (const rawSection of rawSections ?? []) {
    const entryId = rawSection.cms_collection_entry_id

    if (!entryId) {
      continue
    }

    const existingSections = groupedRawSections.get(entryId) ?? []
    existingSections.push(rawSection)
    groupedRawSections.set(entryId, existingSections)
  }

  for (const [entryId, entrySections] of groupedRawSections.entries()) {
    const canonicalSections = entrySections.some((section) => section.page_id === null)
      ? entrySections.filter((section) => section.page_id === null)
      : entrySections

    const mappedSections = canonicalSections
      .map((section) => {
        const fields = (Array.isArray(section.cms_content_fields) ? section.cms_content_fields : [])
          .map((field: any) => ({
            ...(field as CmsContentField),
            schemaField: Array.isArray(field.cms_schema_fields)
              ? field.cms_schema_fields[0] ?? null
              : field.cms_schema_fields ?? null,
          }))
          .sort((a: SectionField, b: SectionField) => (a.order ?? 0) - (b.order ?? 0))

        return mapContentSection({
          id: section.id,
          name: section.name,
          order: section.order,
          fields,
        })
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    sectionsByEntryId.set(entryId, mappedSections)
  }

  const entriesByCollectionId = new Map<string, ContentSectionResponse[][]>()
  const entrySectionsById = new Map<string, ContentSectionResponse[]>()

  for (const [entryId, { entry }] of entryRowsById.entries()) {
    const resolvedSections = sectionsByEntryId.get(entryId) ?? []
    entrySectionsById.set(entryId, resolvedSections)

    const collectionEntries = entriesByCollectionId.get(entry.collection_id) ?? []
    collectionEntries.push(resolvedSections)
    entriesByCollectionId.set(entry.collection_id, collectionEntries)
  }

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

function mapPageSummary(page: CmsPage): PageSummary {
  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    status: page.status,
  }
}

function mapContentField(field: CmsContentField | SectionField, resolvedReferenceContentByFieldId?: Map<string, ContentSectionResponse[]>): ContentFieldResponse {
  return {
    id: field.id,
    type: field.type,
    content: resolvedReferenceContentByFieldId?.get(field.id) ?? field.content,
    order: field.order,
    field_key: 'schemaField' in field ? field.schemaField?.field_key ?? null : null,
  }
}

function mapContentSection(
  section: { id: string; name: string; order: number | null; fields: CmsContentField[] | SectionField[] },
  resolvedReferenceContentByFieldId?: Map<string, ContentSectionResponse[]>
): ContentSectionResponse {
  return {
    id: section.id,
    name: section.name,
    order: section.order,
    fields: section.fields
      .map((field) => mapContentField(field, resolvedReferenceContentByFieldId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }
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

    const pageSections = mapPageSections(data)
    const resolvedReferenceContentByFieldId = await resolveReferenceFieldContent(pageSections)

    return {
      page: mapPageSummary(data),
      sections: pageSections.map((section) => mapContentSection(section, resolvedReferenceContentByFieldId)),
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

    return data as CmsWebsite
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

  async getPageWithLayout(websiteId: string, pageId: string) {
    const page = await getPageById(websiteId, pageId)

    if (!page) {
      return null
    }

    const overrides = await getResolvedLayoutOverrides(page)

    return {
      page: mapPageSummary(page),
      layout: {
        overrides,
      },
    }
  },

  async getPageWithLayoutBySlug(websiteId: string, slug: string) {
    const page = await getPageBySlug(websiteId, slug)

    if (!page) {
      return null
    }

    const overrides = await getResolvedLayoutOverrides(page)

    return {
      page: mapPageSummary(page),
      layout: {
        overrides,
      },
    }
  },

  async getPageCollectionData(pageId: string) {
    const { data: sections, error: sectionsError } = await supabase
      .from('cms_content_sections')
      .select('*')
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
        : Promise.resolve({ data: [], error: null }),
      collectionEntryIds.length > 0
        ? supabase
            .from('cms_collection_entries')
            .select(`
              *,
              cms_collections (*)
            `)
            .in('id', collectionEntryIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (fieldsResult.error) {
      throw fieldsResult.error
    }

    if (collectionEntriesResult.error) {
      throw collectionEntriesResult.error
    }

    const fieldsBySection = new Map<string, SectionField[]>()

    for (const rawField of fieldsResult.data ?? []) {
      const field: SectionField = {
        ...(rawField as CmsContentField),
        schemaField: Array.isArray(rawField.cms_schema_fields)
          ? rawField.cms_schema_fields[0] ?? null
          : rawField.cms_schema_fields ?? null,
      }

      const existingFields = fieldsBySection.get(field.section_id) ?? []
      existingFields.push(field)
      fieldsBySection.set(field.section_id, existingFields)
    }

    const collectionEntryById = new Map<string, { entry: CmsCollectionEntry; collection: CmsCollection | null }>()

    for (const rawEntry of collectionEntriesResult.data ?? []) {
      const collection = Array.isArray(rawEntry.cms_collections)
        ? rawEntry.cms_collections[0] ?? null
        : rawEntry.cms_collections ?? null

      collectionEntryById.set(rawEntry.id, {
        entry: rawEntry as CmsCollectionEntry,
        collection: collection as CmsCollection | null,
      })
    }

    const mappedSections: PageCollectionSection[] = (sections ?? []).map((section) => {
      const collectionData = section.cms_collection_entry_id
        ? collectionEntryById.get(section.cms_collection_entry_id)
        : undefined

      return {
        ...section,
        fields: (fieldsBySection.get(section.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        collectionEntry: collectionData?.entry ?? null,
        collection: collectionData?.collection ?? null,
      }
    })

    const resolvedReferenceContentByFieldId = await resolveReferenceFieldContent(mappedSections)

    return {
      sections: mappedSections.map((section) => ({
        ...mapContentSection(section, resolvedReferenceContentByFieldId),
        collectionEntry: section.collectionEntry ?? null,
        collection: section.collection ?? null,
      })),
    }
  },

  async getFullPageData(websiteId: string, pageId: string) {
    const [pageContent, pageWithLayout, pageCollectionData] = await Promise.all([
      this.getPageContent(websiteId, pageId),
      this.getPageWithLayout(websiteId, pageId),
      this.getPageCollectionData(pageId),
    ])

    if (!pageContent || !pageWithLayout) {
      return null
    }

    const collectionSectionsById = new Map(
      pageCollectionData.sections.map((section) => [section.id, section])
    )

    return {
      page: pageContent.page,
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
}
