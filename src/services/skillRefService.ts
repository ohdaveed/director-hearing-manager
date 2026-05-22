/**
 * Skill Reference Service
 *
 * Fetches skill reference files from Supabase instead of loading them eagerly
 * from disk on every session start.  Each skill's SKILL.md instructs agents
 * to call these helpers on demand when they need deeper reference material.
 *
 * @module services/skillRefService
 */

import { supabase } from "@/lib/supabase";

export type SkillRefRecord = {
  id: string;
  skill_name: string;
  ref_name: string;
  content: string;
  metadata: Record<string, unknown>;
  token_estimate: number | null;
  created_at: string;
  updated_at: string;
};

export const skillRefService = {
  /**
   * Fetch a specific reference by skill name and ref name.
   * Returns null when not found (graceful fallback).
   */
  async getRef(
    skillName: string,
    refName: string,
  ): Promise<SkillRefRecord | null> {
    const { data, error } = await supabase
      .from("skill_references")
      .select("*")
      .eq("skill_name", skillName)
      .eq("ref_name", refName)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      console.error(`skillRefService.getRef error:`, error);
      return null;
    }

    return data;
  },

  /**
   * List all reference names available for a skill.
   */
  async listRefs(skillName: string): Promise<Pick<SkillRefRecord, "ref_name" | "token_estimate">[]> {
    const { data, error } = await supabase
      .from("skill_references")
      .select("ref_name, token_estimate")
      .eq("skill_name", skillName)
      .order("ref_name");

    if (error) {
      console.error(`skillRefService.listRefs error:`, error);
      return [];
    }

    return data;
  },

  /**
   * Full-text search across all skill references.
   */
  async search(query: string, skillName?: string): Promise<SkillRefRecord[]> {
    let builder = supabase
      .from("skill_references")
      .select("*")
      .textSearch("content", query);

    if (skillName) {
      builder = builder.eq("skill_name", skillName);
    }

    const { data, error } = await builder.limit(10);

    if (error) {
      console.error(`skillRefService.search error:`, error);
      return [];
    }

    return data ?? [];
  },
};
