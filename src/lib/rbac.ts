import { supabaseAdmin } from '@/lib/supabase'

export type OrgRole = 'Owner' | 'Admin' | 'Member'

export interface OrgMember {
  id: string
  organizationId: string
  userId: string
  role: OrgRole
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
  subscriptionId?: string
  createdAt: string
  updatedAt: string
}

// Get user's role in an organization
export async function getUserOrgRole(userId: string, organizationId: string): Promise<OrgRole | null> {
  const { data } = await supabaseAdmin!
    .from('OrganizationMember')
    .select('role')
    .eq('userId', userId)
    .eq('organizationId', organizationId)
    .maybeSingle()
  
  return (data?.role as OrgRole) || null
}

// Check if user is owner or admin of organization
export async function isOrgOwnerOrAdmin(userId: string, organizationId: string): Promise<boolean> {
  const role = await getUserOrgRole(userId, organizationId)
  return role === 'Owner' || role === 'Admin'
}

// Check if user is owner of organization
export async function isOrgOwner(userId: string, organizationId: string): Promise<boolean> {
  const role = await getUserOrgRole(userId, organizationId)
  return role === 'Owner'
}

// Get user's organizations
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const { data: members } = await supabaseAdmin!
    .from('OrganizationMember')
    .select('organizationId')
    .eq('userId', userId)
  
  if (!members || members.length === 0) return []
  
  const orgIds = members.map(m => m.organizationId)
  const { data: orgs } = await supabaseAdmin!
    .from('Organization')
    .select('*')
    .in('id', orgIds)
  
  return (orgs || []) as Organization[]
}

// Get organization members
export async function getOrganizationMembers(organizationId: string): Promise<OrgMember[]> {
  const { data } = await supabaseAdmin!
    .from('OrganizationMember')
    .select('*')
    .eq('organizationId', organizationId)
    .order('createdAt', { ascending: true })
  
  return (data || []) as OrgMember[]
}

// Check if user can access org resource (member or owner/admin)
export async function canAccessOrgResource(userId: string, organizationId: string): Promise<boolean> {
  const role = await getUserOrgRole(userId, organizationId)
  return !!role // Any role means access
}

// Check if user can manage org members (owner or admin only)
export async function canManageOrgMembers(userId: string, organizationId: string): Promise<boolean> {
  return await isOrgOwnerOrAdmin(userId, organizationId)
}

// Check if user can manage org settings (owner only)
export async function canManageOrgSettings(userId: string, organizationId: string): Promise<boolean> {
  return await isOrgOwner(userId, organizationId)
}

