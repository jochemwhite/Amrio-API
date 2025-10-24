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

// Health check endpoint
cmsRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'CMS API is healthy',
    timestamp: new Date().toISOString()
  })
})
