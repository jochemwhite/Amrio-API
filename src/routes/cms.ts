import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { cmsService } from '../services/cms'

export const cmsRoutes = new Hono()

// Validation schemas
const websiteParamsSchema = z.object({
  websiteId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid website ID format')
})

const pageParamsSchema = z.object({
  websiteId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid website ID format'),
  pageId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid page ID format')
})

const pageBySlugParamsSchema = z.object({
  websiteId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid website ID format'),
  slug: z.string().min(1, 'Slug is required')
})

const collectionIdParamsSchema = z.object({
  collectionId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid collection ID format')
})

const collectionSlugParamsSchema = z.object({
  websiteId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid website ID format'),
  prefixSlug: z.string().min(1, 'Collection prefix slug is required'),
  entrySlug: z.string().min(1, 'Collection entry slug is required')
})

// Get all pages for a website
cmsRoutes.get(
  '/websites/:websiteId/pages',
  zValidator('param', websiteParamsSchema),
  async (c) => {
    try {
      const { websiteId } = c.req.valid('param')
      const pages = await cmsService.getPagesByWebsiteId(websiteId)
      
      return c.json({
        success: true,
        data: pages
      })
    } catch (error) {
      console.error('Error fetching pages:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch pages'
      }, 500)
    }
  }
)

// Get a specific page with all its content (sections and fields)
cmsRoutes.get(
  '/websites/:websiteId/pages/:pageId',
  zValidator('param', pageParamsSchema),
  async (c) => {
    try {
      const { websiteId, pageId } = c.req.valid('param')
      const pageContent = await cmsService.getPageContent(websiteId, pageId)
      
      if (!pageContent) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }
      
      return c.json({
        success: true,
        data: pageContent
      })
    } catch (error) {
      console.error('Error fetching page content:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch page content'
      }, 500)
    }
  }
)

// Get a page by slug instead of ID
cmsRoutes.get(
  '/websites/:websiteId/pages/slug/:slug',
  zValidator('param', pageBySlugParamsSchema),
  async (c) => {
    try {
      const { websiteId, slug } = c.req.valid('param')
      const pageContent = await cmsService.getPageContentBySlug(websiteId, slug)
      
      if (!pageContent) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }
      
      return c.json({
        success: true,
        data: pageContent
      })
    } catch (error) {
      console.error('Error fetching page content by slug:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch page content'
      }, 500)
    }
  }
)

// Get complete page data including content, layout, and collection data
cmsRoutes.get(
  '/websites/:websiteId/pages/:pageId/full',
  zValidator('param', pageParamsSchema),
  async (c) => {
    try {
      const { websiteId, pageId } = c.req.valid('param')
      const fullPageData = await cmsService.getFullPageData(websiteId, pageId)

      if (!fullPageData) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: fullPageData
      })
    } catch (error) {
      console.error('Error fetching full page data:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch full page data'
      }, 500)
    }
  }
)

// Get complete page data by slug including content, layout, and collection data
cmsRoutes.get(
  '/websites/:websiteId/pages/slug/:slug/full',
  zValidator('param', pageBySlugParamsSchema),
  async (c) => {
    try {
      const { websiteId, slug } = c.req.valid('param')
      const fullPageData = await cmsService.getFullPageDataBySlug(websiteId, slug)

      if (!fullPageData) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: fullPageData
      })
    } catch (error) {
      console.error('Error fetching full page data by slug:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch full page data'
      }, 500)
    }
  }
)

// Get page layout data
cmsRoutes.get(
  '/websites/:websiteId/pages/:pageId/layout',
  zValidator('param', pageParamsSchema),
  async (c) => {
    try {
      const { websiteId, pageId } = c.req.valid('param')
      const pageLayout = await cmsService.getPageWithLayout(websiteId, pageId)

      if (!pageLayout) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: pageLayout
      })
    } catch (error) {
      console.error('Error fetching page layout:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch page layout'
      }, 500)
    }
  }
)

// Get page layout data by slug
cmsRoutes.get(
  '/websites/:websiteId/pages/slug/:slug/layout',
  zValidator('param', pageBySlugParamsSchema),
  async (c) => {
    try {
      const { websiteId, slug } = c.req.valid('param')
      const pageLayout = await cmsService.getPageWithLayoutBySlug(websiteId, slug)

      if (!pageLayout) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: pageLayout
      })
    } catch (error) {
      console.error('Error fetching page layout by slug:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch page layout'
      }, 500)
    }
  }
)

// Get default layouts for a website
cmsRoutes.get(
  '/websites/:websiteId/default-layouts',
  zValidator('param', websiteParamsSchema),
  async (c) => {
    try {
      const { websiteId } = c.req.valid('param')
      const defaultLayouts = await cmsService.getDefaultLayouts(websiteId)

      return c.json({
        success: true,
        data: defaultLayouts
      })
    } catch (error) {
      console.error('Error fetching default layouts:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch default layouts'
      }, 500)
    }
  }
)

// Get page collection data
cmsRoutes.get(
  '/websites/:websiteId/pages/:pageId/collections',
  zValidator('param', pageParamsSchema),
  async (c) => {
    try {
      const { websiteId, pageId } = c.req.valid('param')
      const page = await cmsService.getPageWithLayout(websiteId, pageId)

      if (!page) {
        return c.json({
          success: false,
          error: 'Page not found'
        }, 404)
      }

      const collectionData = await cmsService.getPageCollectionData(pageId, websiteId)

      return c.json({
        success: true,
        data: collectionData
      })
    } catch (error) {
      console.error('Error fetching page collection data:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch page collection data'
      }, 500)
    }
  }
)

// Get website information
cmsRoutes.get(
  '/websites/:websiteId',
  zValidator('param', websiteParamsSchema),
  async (c) => {
    try {
      const { websiteId } = c.req.valid('param')
      const website = await cmsService.getWebsiteById(websiteId)
      
      if (!website) {
        return c.json({
          success: false,
          error: 'Website not found'
        }, 404)
      }
      
      return c.json({
        success: true,
        data: website
      })
    } catch (error) {
      console.error('Error fetching website:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch website'
      }, 500)
    }
  }
)


// Get all collections
cmsRoutes.get('/collections', async (c) => {
  const collections = await cmsService.getCollections()
  return c.json({
    success: true,
    data: collections
  })
})




// Get all collection items
cmsRoutes.get('/collections/:collectionId/items',
  zValidator('param', collectionIdParamsSchema),
  async (c) => {
  const { collectionId } = c.req.valid('param')
  const items = await cmsService.getCollectionItems(collectionId)
  return c.json({
    success: true,
    data: items
  })
})

cmsRoutes.get(
  '/websites/:websiteId/collections/:prefixSlug/:entrySlug',
  zValidator('param', collectionSlugParamsSchema),
  async (c) => {
    try {
      const { websiteId, prefixSlug, entrySlug } = c.req.valid('param')
      const collectionEntry = await cmsService.getCollectionEntryBySlug(websiteId, prefixSlug, entrySlug)

      if (!collectionEntry) {
        return c.json({
          success: false,
          error: 'Collection entry not found'
        }, 404)
      }

      return c.json({
        success: true,
        data: collectionEntry
      })
    } catch (error) {
      console.error('Error fetching collection entry by slug:', error)
      return c.json({
        success: false,
        error: 'Failed to fetch collection entry'
      }, 500)
    }
  }
)

// Health check endpoint
cmsRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'CMS API is healthy',
    timestamp: new Date().toISOString()
  })
})
