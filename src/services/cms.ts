import { supabase } from "../lib/supabase";
import { Database, Json } from "../types/supabase";

type CmsWebsite = Database["public"]["Tables"]["cms_websites"]["Row"];
type CmsPage = Database["public"]["Tables"]["cms_pages"]["Row"];
type CmsSection = Database["public"]["Tables"]["cms_content_sections"]["Row"];
type CmsField = Database["public"]["Tables"]["cms_content_fields"]["Row"];

export interface PageContent extends CmsPage {
  sections: (CmsSection & {
    fields: CmsField[];
  })[];
}

interface GetPageContentResponse {
  id: string;
  slug: string;
  sections: {
    id: string;
    name: string;
    order: number;
    fields: {
      id: string;
      type: string;
      order: number;
      content: Json;
    }[];
  }[]
}

export class CmsService {
  async getWebsiteById(websiteId: string): Promise<CmsWebsite | null> {
    const { data, error } = await supabase.from("cms_websites").select("*").eq("id", websiteId).single();

    if (error) {
      console.error("Error fetching website:", error);
      throw new Error("Failed to fetch website");
    }

    return data;
  }

  async getPagesByWebsiteId(websiteId: string): Promise<CmsPage[]> {
    const { data, error } = await supabase.from("cms_pages").select("*").eq("website_id", websiteId).order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pages:", error);
      throw new Error("Failed to fetch pages");
    }

    return data || [];
  }

  async getPageContent(websiteId: string, pageId: string): Promise<GetPageContentResponse | null> {
    const { data: page, error: pageError } = await supabase
      .rpc("get_page_content", {
        page_id_param: pageId,
        website_id_param: websiteId,
      })
      .single();

    if (pageError || !page) {
      console.error("Error fetching page:", pageError);
      return null;
    }

    const parsedPage = page as GetPageContentResponse;

    const orderedSections = parsedPage.sections.sort((a, b) => a.order - b.order);
    const orderedFields = orderedSections.map((section) => {
      return section.fields.sort((a, b) => a.order - b.order);
    });

    const orderedPage: GetPageContentResponse = {
      ...parsedPage,
      sections: orderedSections,
    };

    return orderedPage;
  }

  async getPageContentBySlug(websiteId: string, slug: string): Promise<GetPageContentResponse | null> {
    // First, get the page by slug and website ID
    const { data: page, error: pageError } = await supabase.from("cms_pages").select("*").eq("slug", slug).eq("website_id", websiteId).single();

    if (pageError || !page) {
      return null;
    }

    // Use the existing getPageContent method with the found page ID
    return this.getPageContent(websiteId, page.id);
  }

  async getWebsiteByDomain(domain: string): Promise<CmsWebsite | null> {
    const { data, error } = await supabase.from("cms_websites").select("*").eq("domain", domain).single();

    if (error) {
      console.error("Error fetching website by domain:", error);
      return null;
    }

    return data;
  }

  async getSectionById(sectionId: string): Promise<CmsSection | null> {
    const { data, error } = await supabase.from("cms_content_sections").select("*").eq("id", sectionId).single();

    if (error) {
      console.error("Error fetching section:", error);
      throw new Error("Failed to fetch section");
    }

    return data;
  }

  async getFieldsBySectionId(sectionId: string): Promise<CmsField[]> {
    const { data, error } = await supabase.from("cms_content_fields").select("*").eq("section_id", sectionId).order("order", { ascending: true });

    if (error) {
      console.error("Error fetching fields:", error);
      throw new Error("Failed to fetch fields");
    }

    return data || [];
  }

  async getCollections(): Promise<Database["public"]["Tables"]["cms_collections"]["Row"][]> {
    const { data, error } = await supabase.from("cms_collections").select("*");

    if (error) {
      console.error("Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }

    return data || [];
  }

  async getCollectionEntries(collectionId: string): Promise<Database["public"]["Tables"]["cms_collection_entries"]["Row"][]> {
    const { data, error } = await supabase.from("cms_collection_entries").select("*").eq("collection_id", collectionId);

    if (error) {
      console.error("Error fetching collection groups:", error);
      throw new Error("Failed to fetch collection groups");
    }

    return data || [];
  }

  async getCollectionItems(collectionId: string): Promise<any> {
    const { data, error } = await supabase
      .from("cms_collections_items")
      .select("*,cms_collection_entries(*,cms_collections_items(*))")
      .eq("collection_id", collectionId);

    if (error) {
      console.error("Error fetching collection items:", error);
      throw new Error("Failed to fetch collection items");
    }

    return data || [];
  }
}

export const cmsService = new CmsService();
