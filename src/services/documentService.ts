import { supabase } from "@/lib/supabase";

export type DocumentCategory =
  | "Regulatory SOP"
  | "Legal Logic & Citations"
  | "Draft Hearing Packet"
  | "Official Hearing Record"
  | "Evidence: Inspection Report"
  | "Evidence: Photographic"
  | "Service & Notice Proof"
  | "General Reference"
  | "Article 11 Health Code";

export interface DocumentMetadata {
  [key: string]: unknown;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  file_path: string;
  file_type: string;
  version: string;
  metadata: DocumentMetadata;
  uploaded_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegulatoryReference {
  id: string;
  violation_code: string;
  short_title: string;
  verbatim_text: string;
  source_document_id?: string;
  source_section?: string;
  standard_corrective_action?: string;
  metadata?: any;
}

export const documentService = {
  async uploadDocument(
    file: File,
    category: DocumentCategory,
    metadata: DocumentMetadata = {},
    version: string = "1.0",
  ): Promise<DocumentRecord> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
    const filePath = `${category.toLowerCase().replace(/\s+/g, "-")}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("hearing-documents")
      .upload(filePath, file);

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error(`Failed to upload file to storage: ${storageError.message}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: dbError } = await supabase
      .from("documents")
      .insert([
        {
          title: file.name,
          category,
          file_path: filePath,
          file_type: file.type,
          version,
          metadata,
          uploaded_by: user?.id,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw new Error(`Failed to create document record: ${dbError.message}`);
    }

    return data;
  },

  async saveParsedContent(
    documentId: string,
    content: {
      rawText?: string;
      structuredData?: any;
      tokensUsed?: number;
      aiModel?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("parsed_document_content")
      .insert([
        {
          document_id: documentId,
          raw_text: content.rawText,
          structured_data: content.structuredData,
          tokens_used: content.tokensUsed,
          ai_model: content.aiModel,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Parsed content save error:", error);
      throw new Error(`Failed to save parsed content: ${error.message}`);
    }

    return data;
  },

  async getDocumentsByCategory(category: DocumentCategory) {
    const { data, error } = await supabase
      .from("documents")
      .select("*, parsed_document_content(*)")
      .eq("category", category)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  getDocumentUrl(filePath: string) {
    const { data } = supabase.storage.from("hearing-documents").getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Fetches regulatory references matching a violation code.
   */
  async getRegulatoryReferences(violationCode: string): Promise<RegulatoryReference[]> {
    const { data, error } = await supabase
      .from("regulatory_reference")
      .select("*")
      .ilike("violation_code", `%${violationCode}%`)
      .eq("is_active", true);

    if (error) throw error;
    return data;
  },

  /**
   * Search regulatory references by keyword.
   */
  async searchRegulatoryReferences(query: string): Promise<RegulatoryReference[]> {
    const { data, error } = await supabase
      .from("regulatory_reference")
      .select("*")
      .textSearch("fts", query)
      .eq("is_active", true);

    if (error) throw error;
    return data;
  },
};
