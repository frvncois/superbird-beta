import { db } from '../db/client'
import { projects } from '../db/schema'
import type { Project } from '../../shared/types'

/** The single installed project, or null. (One project per install for now.) */
export function getInstalledProject(): Project | null {
  return db.select().from(projects).limit(1).get() ?? null
}
