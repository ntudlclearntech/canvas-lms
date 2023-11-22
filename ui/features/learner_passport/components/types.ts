/*
 * Copyright (C) 2023 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

export interface AchievementData {
  id: string
  isNew: boolean
  title: string
  type: string | null
  criteria: string | null
  issuer: {
    name: string
    url?: string
    iconUrl?: string
  }
  issuedOn: string
  expiresOn: string | null
  imageUrl: string | null
  skills: SkillData[]
  verifiedBy: string | null
}

export interface PortfolioData {
  id: string
  title: string
  heroImageUrl: string | null
}

export interface PortfolioDetailData extends PortfolioData {
  blurb: string
  city: string
  state: string
  phone: string
  email: string
  about: string
  skills: SkillData[]
  links: string[]
  education: EducationData[]
  experience: ExperienceData[]
  achievements: AchievementData[]
}

export interface SkillData {
  name: string
  verified: boolean
  url?: string
}

export interface EducationData {
  title: string
  institution: string
  location: string
  from_date: string
  to_date: string
  description: string
}

export interface ExperienceData {
  where: 'Pendo'
  title: string
  from_date: string
  to_date: string
  description: string
}
